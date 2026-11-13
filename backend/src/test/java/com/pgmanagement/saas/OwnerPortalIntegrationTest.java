package com.pgmanagement.saas;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OwnerPortalIntegrationTest extends AbstractIntegrationTest {

    @Test
    void supportsMultiplePropertiesPaginationSearchAndFloorOccupancy() throws Exception {
        AuthSession owner = authenticateAllowlistedOwnerOne();

        String prop1Id = createProperty(owner, "Sapphire Elite", "Bengaluru", 5, 3, 200);
        String prop2Id = createProperty(owner, "Coral Men PG", "Hyderabad", 1, 5, 300);

        mockMvc.perform(get("/properties/search?search=Sapphire&page=0&size=1")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.items[0].name", is("Sapphire Elite")));

        mockMvc.perform(get("/properties/search?page=0&size=1")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.hasNext", is(true)));

        // Floor-wise rooms + occupancy
        String roomF1 = createRoom(owner, prop1Id, "101", 1, "DOUBLE", 11000);
        String roomF2 = createRoom(owner, prop1Id, "201", 2, "SINGLE", 15000);

        String bedF1A = addBed(owner, roomF1, "101-A");
        String bedF1B = addBed(owner, roomF1, "101-B");
        String bedF2A = addBed(owner, roomF2, "201-A");

        // Filter rooms on floor 2
        mockMvc.perform(get("/rooms/search?propertyId=" + prop1Id + "&floorNumber=2&page=0&size=10")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.items[0].roomNumber", is("201")))
                .andExpect(jsonPath("$.data.items[0].totalBeds", is(1)));

        // Put bed 101-B in MAINTENANCE, verify room occupancy summary
        mockMvc.perform(patch("/rooms/beds/" + bedF1B + "/status")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"MAINTENANCE\"}"))
                .andExpect(status().isOk());

        // Onboard two residents & prevent double bed allocation
        JsonNode res1 = onboardResident(owner, "+919845000010", "Kiran Rao");
        JsonNode res2 = onboardResident(owner, "+919845000011", "Vikram Nair");

        String booking1 = createBooking(owner, res1.path("userId").asText(), bedF1A, 11000);

        // Attempt to allocate SAME already-occupied bedF1A to res2 -> must fail 409 Conflict
        mockMvc.perform(post("/bookings")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "residentId", res2.path("userId").asText(),
                                "bedId", bedF1A,
                                "checkInDate", LocalDate.now().toString(),
                                "agreedMonthlyRent", 11000
                        ))))
                .andExpect(status().isConflict());

        // Cannot delete occupied bed
        mockMvc.perform(delete("/rooms/beds/" + bedF1A)
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isConflict());

        // Allocate res2 to vacant bedF2A
        createBooking(owner, res2.path("userId").asText(), bedF2A, 15000);

        // Room F1 now has 2 beds: 1 occupied, 0 vacant, 1 maintenance -> 50%
        mockMvc.perform(get("/rooms/" + roomF1)
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalBeds", is(2)))
                .andExpect(jsonPath("$.data.occupiedBeds", is(1)))
                .andExpect(jsonPath("$.data.vacantBeds", is(0)))
                .andExpect(jsonPath("$.data.maintenanceBeds", is(1)))
                .andExpect(jsonPath("$.data.occupancyPercentage", is(50.0)));

        // Configure rent & due date on property 2 and adjust booking 1 agreed rent
        mockMvc.perform(patch("/properties/" + prop2Id + "/rent-config")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"defaultBillingDay\":10,\"gracePeriodDays\":4,\"lateFeeAmount\":500}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.defaultBillingDay", is(10)));

        mockMvc.perform(patch("/bookings/" + booking1 + "/rent")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"agreedMonthlyRent\":11500,\"notes\":\"Updated corner AC rate\"}"))
                .andExpect(status().isOk());

        // Notice -> Checkout releases bed back to VACANT and supports re-allocation
        mockMvc.perform(patch("/bookings/" + booking1 + "/notice")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedCheckOutDate\":\"" + LocalDate.now().plusDays(15) + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("NOTICE_GIVEN")));

        mockMvc.perform(patch("/bookings/" + booking1 + "/checkout")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"depositStatus\":\"REFUNDED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CHECKED_OUT")));

        // Vacant bed list now returns bedF1A again
        mockMvc.perform(get("/rooms/beds?propertyId=" + prop1Id + "&status=VACANT")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is(bedF1A)));
    }

    @Test
    void secureInvitationsMonthlyInvoicesOverdueCashPaymentsAnnouncementsAndLiveDashboardWorkEndToEnd() throws Exception {
        AuthSession owner = authenticateAllowlistedOwnerOne();
        String propId = createProperty(owner, "Greenleaf Towers", "Pune", 3, 2, 150);
        String roomId = createRoom(owner, propId, "301", 3, "DOUBLE", 9500);
        String bedId = addBed(owner, roomId, "301-A");

        JsonNode residentProfile = onboardResident(owner, "+919820001122", "Neha Kulkarni");
        String residentProfileId = residentProfile.path("id").asText();
        String residentUserId = residentProfile.path("userId").asText();

        // Generate invitation -> returns inviteCode once, list hides raw code
        MvcResult invResult = mockMvc.perform(post("/residents/" + residentProfileId + "/invitations")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "propertyId", propId,
                                "expiresInHours", 48
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.inviteCode", is(notNullValue())))
                .andExpect(jsonPath("$.data.status", is("PENDING")))
                .andReturn();

        String inviteCode = extractData(invResult).path("inviteCode").asText();

        mockMvc.perform(get("/residents/invitations?page=0&size=10")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.items[0].inviteCode").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].status", is("PENDING")));

        // Wrong-phone Firebase user cannot claim another resident's invite
        mockMvc.perform(post("/auth/firebase/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firebaseIdToken", mockToken("uid-wrong-phone", "+919899998888", "Intruder"),
                                "inviteCode", inviteCode
                        ))))
                .andExpect(status().isForbidden());

        // Right resident logs in with Firebase Phone OTP + inviteCode -> auto-accepts invitation!
        AuthSession residentSession = authenticateWithFirebase(
                "uid-neha", "+919820001122", null, null, inviteCode);

        mockMvc.perform(get("/residents/invitations?status=ACCEPTED")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)));

        // Allocate bed & check monthly invoice batch generation (idempotent)
        String bookingId = createBooking(owner, residentUserId, bedId, 9500);
        LocalDate upcomingMonth = LocalDate.now().plusMonths(1).withDayOfMonth(1);

        MvcResult gen1 = mockMvc.perform(post("/invoices/generate-monthly")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "billingMonth", upcomingMonth.toString(),
                                "propertyId", propId,
                                "utilityCharges", 500,
                                "notes", "Standard monthly run"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.createdCount", is(1)))
                .andExpect(jsonPath("$.data.skippedCount", is(0)))
                .andReturn();

        String currentInvoiceId = extractData(gen1).path("generatedInvoices").get(0).path("id").asText();

        // Re-running same month must skip idempotently
        mockMvc.perform(post("/invoices/generate-monthly")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "billingMonth", upcomingMonth.toString(),
                                "propertyId", propId
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.createdCount", is(0)))
                .andExpect(jsonPath("$.data.skippedCount", is(1)));

        // Create a past-due invoice and run mark-overdue
        LocalDate pastMonth = upcomingMonth.minusMonths(2);
        mockMvc.perform(post("/invoices")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "bookingId", bookingId,
                                "billingMonth", pastMonth.toString(),
                                "utilityCharges", 0,
                                "penaltyFee", 0,
                                "dueDate", LocalDate.now().minusDays(12).toString(),
                                "notes", "Arrears month"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/invoices/mark-overdue")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].status", is("OVERDUE")));

        mockMvc.perform(get("/invoices/search?overdueOnly=true&page=0&size=10")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)));

        // Record cash payment idempotently
        Map<String, Object> cashReq = Map.of(
                "invoiceId", currentInvoiceId,
                "paymentMethod", "CASH",
                "amount", 10000,
                "idempotencyKey", "cash-idemp-999",
                "referenceNumber", "RCP-CASH-99",
                "notes", "Paid in hand at reception"
        );
        String paymentId = extractId(mockMvc.perform(post("/payments")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cashReq)))
                .andExpect(status().isCreated())
                .andReturn());

        // Duplicate idempotency key returns same payment without double credit
        MvcResult dupPay = mockMvc.perform(post("/payments")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cashReq)))
                .andExpect(status().isCreated())
                .andReturn();
        assertEquals(paymentId, extractData(dupPay).path("id").asText());

        // Publish announcement + verify resident sees it and owner search finds it
        String annId = extractId(mockMvc.perform(post("/announcements")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "propertyId", propId,
                                "title", "Solar Heater Servicing",
                                "content", "Hot water maintenance 2 PM to 4 PM tomorrow.",
                                "priority", "IMPORTANT"
                        ))))
                .andExpect(status().isCreated())
                .andReturn());

        mockMvc.perform(get("/announcements/search?search=Solar")
                        .header("Authorization", "Bearer " + residentSession.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)));

        // Verify live Owner Dashboard statistics
        MvcResult dashRes = mockMvc.perform(get("/owners/dashboard")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode dash = extractData(dashRes);
        assertEquals(1, dash.path("totalProperties").asLong());
        assertEquals(1, dash.path("totalRooms").asLong());
        assertEquals(1, dash.path("occupiedBeds").asLong());
        assertEquals(0, dash.path("vacantBeds").asLong());
        assertEquals(1, dash.path("activeBookings").asLong());
        assertEquals(1, dash.path("pendingKycCount").asLong());
        assertEquals(1, dash.path("overdueInvoicesCount").asLong());
        assertEquals(0, new BigDecimal("10000").compareTo(new BigDecimal(dash.path("collectedThisMonth").asText())));
        assertEquals(0, new BigDecimal("9500").compareTo(new BigDecimal(dash.path("overdueRentTotal").asText())));

        // Deactivate announcement cleanly
        mockMvc.perform(patch("/announcements/" + annId + "/deactivate")
                        .header("Authorization", "Bearer " + owner.accessToken()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/announcements")
                        .header("Authorization", "Bearer " + residentSession.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    private String mockToken(String uid, String phone, String name) {
        String idToken = "token-" + uid;
        org.mockito.Mockito.when(firebaseTokenVerifier.verifyIdToken(idToken))
                .thenReturn(new com.pgmanagement.saas.modules.auth.firebase.FirebaseTokenDetails(
                        uid, phone, null, name, null));
        return idToken;
    }

    private String createProperty(
            AuthSession owner, String name, String city, int billingDay, int graceDays, int lateFee) throws Exception {
        return extractId(mockMvc.perform(post("/properties")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", name,
                                "propertyType", "CO_LIVING",
                                "addressLine1", "100 Main Street",
                                "city", city,
                                "state", "India",
                                "postalCode", "560001",
                                "emergencyContact", "+919900001122",
                                "defaultBillingDay", billingDay,
                                "gracePeriodDays", graceDays,
                                "lateFeeAmount", lateFee
                        ))))
                .andExpect(status().isCreated())
                .andReturn());
    }

    private String createRoom(
            AuthSession owner, String propertyId, String roomNumber, int floor, String sharingType, int rent) throws Exception {
        return extractId(mockMvc.perform(post("/rooms")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "propertyId", propertyId,
                                "roomNumber", roomNumber,
                                "floorNumber", floor,
                                "sharingType", sharingType,
                                "baseMonthlyRent", rent
                        ))))
                .andExpect(status().isCreated())
                .andReturn());
    }

    private String addBed(AuthSession owner, String roomId, String bedCode) throws Exception {
        return extractId(mockMvc.perform(post("/rooms/" + roomId + "/beds")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bedCode\":\"" + bedCode + "\"}"))
                .andExpect(status().isCreated())
                .andReturn());
    }

    private JsonNode onboardResident(AuthSession owner, String phone, String fullName) throws Exception {
        MvcResult res = mockMvc.perform(post("/residents")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "phone", phone,
                                "fullName", fullName
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        return extractData(res);
    }

    private String createBooking(AuthSession owner, String residentUserId, String bedId, int rent) throws Exception {
        return extractId(mockMvc.perform(post("/bookings")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "residentId", residentUserId,
                                "bedId", bedId,
                                "checkInDate", LocalDate.now().toString(),
                                "agreedMonthlyRent", rent,
                                "securityDepositAmount", rent * 2,
                                "depositStatus", "PAID"
                        ))))
                .andExpect(status().isCreated())
                .andReturn());
    }
}
