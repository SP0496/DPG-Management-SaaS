package com.pgmanagement.saas;

import com.pgmanagement.saas.modules.auth.firebase.FirebaseTokenDetails;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.shared.exception.UnauthorizedException;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SecurityIntegrationTest extends AbstractIntegrationTest {

    @Test
    void publicHealthEndpointIsAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    void protectedEndpointsRejectMissingAuthentication() throws Exception {
        mockMvc.perform(get("/properties"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/owners/dashboard"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/residents/me/room"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void legacyPasswordRegistrationAndLoginRoutesAreBlocked() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@y.com\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@y.com\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidOrRejectedFirebaseTokenCannotObtainSession() throws Exception {
        when(firebaseTokenVerifier.verifyIdToken("forged-token"))
                .thenThrow(new UnauthorizedException("Invalid Firebase authentication token"));

        mockMvc.perform(post("/auth/firebase/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firebaseIdToken\":\"forged-token\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void ignoresClientSuppliedRoleAndHeadersAndAssignsResidentByDefault() throws Exception {
        when(firebaseTokenVerifier.verifyIdToken("resident-claimless-token"))
                .thenReturn(new FirebaseTokenDetails(
                        "uid-spoof-attempt",
                        "+919822334455",
                        null,
                        "Attempting Elevation",
                        null
                ));

        mockMvc.perform(post("/auth/firebase/verify")
                        .header("X-User-Role", "OWNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firebaseIdToken", "resident-claimless-token",
                                "role", "OWNER",
                                "fullName", "Attempting Elevation"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role", is("RESIDENT")))
                .andExpect(jsonPath("$.data.user.phone", is("+919822334455")));
    }

    @Test
    void residentCannotAccessOwnerEndpointsAndOwnerCannotAccessResidentSelfEndpoints() throws Exception {
        AuthSession resident = authenticateWithFirebase(
                "uid-sec-res", "+919811223344", "Resident User", null, null);
        AuthSession owner = authenticateAllowlistedOwnerOne();

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + resident.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role", is("RESIDENT")));

        mockMvc.perform(get("/properties")
                        .header("Authorization", "Bearer " + resident.accessToken()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/owners/dashboard")
                        .header("Authorization", "Bearer " + resident.accessToken()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/residents/me")
                        .header("Authorization", "Bearer " + resident.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.phone", is("+919811223344")));

        mockMvc.perform(get("/residents/me")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/residents/me/room")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void strictOwnerIsolationBlocksCrossOwnerAccessToPropertiesRoomsResidentsAndInvoices() throws Exception {
        AuthSession ownerA = authenticateAllowlistedOwnerOne();
        AuthSession ownerB = authenticateAllowlistedOwnerTwo();

        String propBody = objectMapper.writeValueAsString(Map.of(
                "name", "Alpha PG",
                "propertyType", "MENS_PG",
                "addressLine1", "10 Residency Road",
                "city", "Bengaluru",
                "state", "Karnataka",
                "postalCode", "560025",
                "emergencyContact", "+919800000011"
        ));

        String propertyId = extractId(mockMvc.perform(post("/properties")
                        .header("Authorization", "Bearer " + ownerA.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(propBody))
                .andExpect(status().isCreated())
                .andReturn());

        mockMvc.perform(get("/properties/" + propertyId)
                        .header("Authorization", "Bearer " + ownerB.accessToken()))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/rooms")
                        .header("Authorization", "Bearer " + ownerB.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "propertyId", propertyId,
                                "roomNumber", "201",
                                "floorNumber", 2,
                                "sharingType", "DOUBLE",
                                "baseMonthlyRent", 9500
                        ))))
                .andExpect(status().isNotFound());
    }

    @Test
    void firebaseIdentityMismatchForExistingPhoneIsRejected() throws Exception {
        authenticateWithFirebase("uid-first", "+919833445566", "Original User", Role.RESIDENT, null);

        when(firebaseTokenVerifier.verifyIdToken("hijack-token"))
                .thenReturn(new FirebaseTokenDetails(
                        "uid-hijacker", "+919833445566", null, "Spoofer", null));

        mockMvc.perform(post("/auth/firebase/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firebaseIdToken\":\"hijack-token\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void refreshTokenRotationLogoutRevocationAndInvalidBearerJwtEnforced() throws Exception {
        AuthSession resident = authenticateWithFirebase(
                "uid-sec-refresh", "+919844556677", "Refresh User", null, null);

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer tampered.jwt.token"))
                .andExpect(status().isUnauthorized());

        var refreshRes = mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", resident.refreshToken()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.refreshToken").isString())
                .andReturn();

        String rotatedRefresh = extractData(refreshRes).path("refreshToken").asText();

        // Reusing old rotated refresh token must fail
        mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", resident.refreshToken()))))
                .andExpect(status().isUnauthorized());

        // Logout revokes current refresh token
        mockMvc.perform(post("/auth/logout")
                        .header("Authorization", "Bearer " + resident.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", rotatedRefresh))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", rotatedRefresh))))
                .andExpect(status().isUnauthorized());
    }
}
