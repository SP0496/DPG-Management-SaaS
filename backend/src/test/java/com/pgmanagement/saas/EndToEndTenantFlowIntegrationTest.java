package com.pgmanagement.saas;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class EndToEndTenantFlowIntegrationTest extends AbstractIntegrationTest {

    @Test
    void fullOwnerToResidentLifecycleMaintainsIsolationAndIntegrity() throws Exception {
        AuthSession ownerOne = authenticateAllowlistedOwnerOne();
        AuthSession ownerTwo = authenticateAllowlistedOwnerTwo();

        String propertyId = extractId(mockMvc.perform(post("/properties")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Emerald Residency PG",
                                "propertyType", "CO_LIVING",
                                "addressLine1", "42 Indiranagar 100 Feet Road",
                                "city", "Bengaluru",
                                "state", "Karnataka",
                                "postalCode", "560038",
                                "emergencyContact", "+919900112233",
                                "defaultBillingDay", 5,
                                "gracePeriodDays", 3,
                                "lateFeeAmount", 250
                        ))))
                .andExpect(status().isCreated())
                .andReturn());

        String roomId = extractId(mockMvc.perform(post("/rooms")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "propertyId", propertyId,
                                "roomNumber", "101",
                                "floorNumber", 1,
                                "sharingType", "DOUBLE",
                                "baseMonthlyRent", 12000,
                                "hasAttachedBathroom", true,
                                "hasBalcony", true
                        ))))
                .andExpect(status().isCreated())
                .andReturn());

        String bedId = extractId(mockMvc.perform(post("/rooms/" + roomId + "/beds")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bedCode\":\"B1\"}"))
                .andExpect(status().isCreated())
                .andReturn());

        var residentResp = mockMvc.perform(post("/residents")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "phone", "+919811112222",
                                "fullName", "Aarav Sharma",
                                "occupation", "Software Engineer"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.phone", is("+919811112222")))
                .andReturn();

        String residentUserId = extractData(residentResp).path("userId").asText();

        String bookingId = extractId(mockMvc.perform(post("/bookings")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "residentId", residentUserId,
                                "bedId", bedId,
                                "checkInDate", LocalDate.now().toString(),
                                "agreedMonthlyRent", 12000,
                                "securityDepositAmount", 24000,
                                "depositStatus", "PAID",
                                "notes", "Corner bed allocated"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andReturn());

        // Resident signs in via Firebase OTP using +919811112222 -> matches pre-onboarded account cleanly
        AuthSession resident = authenticateWithFirebase(
                "uid-aarav", "+919811112222", null, null, null);

        mockMvc.perform(get("/residents/me/room")
                        .header("Authorization", "Bearer " + resident.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.propertyName", is("Emerald Residency PG")))
                .andExpect(jsonPath("$.data.roomNumber", is("101")))
                .andExpect(jsonPath("$.data.bedNumber", is("B1")));

        LocalDate billingMonth = LocalDate.now().withDayOfMonth(1);
        String invoiceId = extractId(mockMvc.perform(post("/invoices")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "bookingId", bookingId,
                                "billingMonth", billingMonth.toString(),
                                "utilityCharges", 800,
                                "penaltyFee", 0,
                                "dueDate", LocalDate.now().plusDays(5).toString(),
                                "notes", "Monthly rent + EB charges"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.totalAmount", is(12800)))
                .andReturn());

        mockMvc.perform(post("/payments")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "invoiceId", invoiceId,
                                "paymentMethod", "CASH",
                                "amount", 12800,
                                "idempotencyKey", "pay-e2e-001",
                                "referenceNumber", "CASH-RCP-01"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")));

        mockMvc.perform(get("/invoices")
                        .header("Authorization", "Bearer " + resident.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].status", is("PAID")));

        String complaintId = extractId(mockMvc.perform(post("/complaints")
                        .header("Authorization", "Bearer " + resident.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Bathroom Tap Leak",
                                "description", "Slow dripping near sink",
                                "category", "PLUMBING",
                                "priority", "MEDIUM"
                        ))))
                .andExpect(status().isCreated())
                .andReturn());

        mockMvc.perform(patch("/complaints/" + complaintId + "/status")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED\",\"resolutionNotes\":\"Washer replaced\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("RESOLVED")));

        // Owner Two sees zero records belonging to Owner One
        mockMvc.perform(get("/complaints")
                        .header("Authorization", "Bearer " + ownerTwo.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));

        mockMvc.perform(patch("/bookings/" + bookingId + "/checkout")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"depositStatus\":\"REFUNDED\",\"notes\":\"Full handover complete\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CHECKED_OUT")));

        mockMvc.perform(get("/rooms/" + roomId + "/beds")
                        .header("Authorization", "Bearer " + ownerOne.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status", is("VACANT")));
    }
}
