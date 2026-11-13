package com.pgmanagement.saas;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ResidentPortalIntegrationTest extends AbstractIntegrationTest {

    @Test
    void unassignedResidentReceivesSafeEmptyDashboardRoomAnnouncementsAndMenu() throws Exception {
        AuthSession unassignedResident = authenticateWithFirebase(
                "uid-res-unassigned", "+919870000111", "Aarav Unassigned", null, null);

        assertEquals("RESIDENT", unassignedResident.role());

        mockMvc.perform(get("/residents/me/dashboard")
                        .header("Authorization", "Bearer " + unassignedResident.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.profile.fullName", is("Aarav Unassigned")))
                .andExpect(jsonPath("$.data.assignedRoom").doesNotExist())
                .andExpect(jsonPath("$.data.outstandingBalance", is(0)))
                .andExpect(jsonPath("$.data.overdueBalance", is(0)))
                .andExpect(jsonPath("$.data.pendingInvoicesCount", is(0)))
                .andExpect(jsonPath("$.data.recentAnnouncements", hasSize(0)));

        mockMvc.perform(get("/residents/me/room")
                        .header("Authorization", "Bearer " + unassignedResident.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());

        mockMvc.perform(get("/announcements/search")
                        .header("Authorization", "Bearer " + unassignedResident.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(0)));

        mockMvc.perform(get("/food-menu")
                        .header("Authorization", "Bearer " + unassignedResident.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void assignedResidentCanViewCompletePortalDataDownloadReceiptsTrackComplaintsAndUpdateProfile() throws Exception {
        AuthSession ownerOne = authenticateAllowlistedOwnerOne();
        AuthSession ownerTwo = authenticateAllowlistedOwnerTwo();

        String prop1Id = createProperty(ownerOne, "Emerald Co-Living", "Bengaluru", 5, 3, 250);
        String prop2Id = createProperty(ownerTwo, "Other Owner PG", "Pune", 1, 2, 100);

        String room1Id = createRoom(ownerOne, prop1Id, "204", 2, "DOUBLE", 12000, true, true);
        String bed1AId = addBed(ownerOne, room1Id, "204-A");
        String bed1BId = addBed(ownerOne, room1Id, "204-B");

        String otherRoomId = createRoom(ownerTwo, prop2Id, "901", 9, "SINGLE", 18000, true, false);
        String otherBedId = addBed(ownerTwo, otherRoomId, "901-A");

        JsonNode res1Node = onboardResident(ownerOne, "+919870001001", "Rohan Sharma");
        JsonNode res2Node = onboardResident(ownerOne, "+919870001002", "Kunal Verma");
        JsonNode otherResNode = onboardResident(ownerTwo, "+919870002001", "Deepak Other");

        createBooking(ownerOne, res1Node.path("userId").asText(), bed1AId, 12000);
        String res2BookingId = createBooking(ownerOne, res2Node.path("userId").asText(), bed1BId, 12000);
        createBooking(ownerTwo, otherResNode.path("userId").asText(), otherBedId, 18000);

        AuthSession res1Session = authenticateWithFirebase(
                "uid-rohan", "+919870001001", null, null, null);
        AuthSession res2Session = authenticateWithFirebase(
                "uid-kunal", "+919870001002", null, null, null);

        // Issue two invoices for res1 (one paid, one open/overdue) and one for res2
        LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate pastMonth = currentMonth.minusMonths(1);

        MvcResult res1PastInvRes = mockMvc.perform(post("/invoices/generate-monthly")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "billingMonth", pastMonth.toString(),
                                "propertyId", prop1Id,
                                "utilityCharges", 600
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        String res1PastInvoiceId = findInvoiceIdByResident(
                extractData(res1PastInvRes).path("generatedInvoices"), res1Node.path("userId").asText());
        String res2PastInvoiceId = findInvoiceIdByResident(
                extractData(res1PastInvRes).path("generatedInvoices"), res2Node.path("userId").asText());

        MvcResult res1CurrInvRes = mockMvc.perform(post("/invoices/generate-monthly")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "billingMonth", currentMonth.toString(),
                                "propertyId", prop1Id,
                                "utilityCharges", 500
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        String res1CurrInvoiceId = findInvoiceIdByResident(
                extractData(res1CurrInvRes).path("generatedInvoices"), res1Node.path("userId").asText());

        // Pay past invoice for res1 & res2
        String res1PaymentId = extractId(mockMvc.perform(post("/payments")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "invoiceId", res1PastInvoiceId,
                                "paymentMethod", "UPI_MANUAL",
                                "amount", 12600,
                                "idempotencyKey", "res1-pay-001",
                                "referenceNumber", "UPI-REF-8811",
                                "notes", "Monthly rent cleared via UPI"
                        ))))
                .andExpect(status().isCreated())
                .andReturn());

        String res2PaymentId = extractId(mockMvc.perform(post("/payments")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "invoiceId", res2PastInvoiceId,
                                "paymentMethod", "CASH",
                                "amount", 12600,
                                "idempotencyKey", "res2-pay-001"
                        ))))
                .andExpect(status().isCreated())
                .andReturn());

        // Publish announcements for prop1 (ownerOne) and prop2 (ownerTwo)
        mockMvc.perform(post("/announcements")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "propertyId", prop1Id,
                                "title", "Weekend Deep Cleaning",
                                "content", "Corridors cleaned Saturday at 10 AM.",
                                "priority", "IMPORTANT"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/announcements")
                        .header("Authorization", "Bearer " + ownerTwo.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "propertyId", prop2Id,
                                "title", "Secret Owner Two Notice",
                                "content", "Must never leak to ownerOne resident.",
                                "priority", "URGENT"
                        ))))
                .andExpect(status().isCreated());

        // Owner updates Monday food menu
        mockMvc.perform(put("/food-menu")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "propertyId", prop1Id,
                                "dayOfWeek", "MONDAY",
                                "breakfast", "Masala Dosa & Filter Coffee",
                                "lunch", "Rajma Chawal & Salad",
                                "dinner", "Paneer Butter Masala & Phulka",
                                "snacks", "Samosa & Ginger Tea"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.breakfast", is("Masala Dosa & Filter Coffee")));

        // Resident raises complaint & owner updates status to IN_PROGRESS
        String complaintId = extractId(mockMvc.perform(post("/complaints")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "category", "PLUMBING",
                                "title", "Bathroom tap dripping",
                                "description", "Washbasin cold water tap leaks continuously.",
                                "priority", "HIGH"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("OPEN")))
                .andReturn());

        mockMvc.perform(patch("/complaints/" + complaintId + "/status")
                        .header("Authorization", "Bearer " + ownerOne.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "IN_PROGRESS",
                                "resolutionNotes", "Plumber scheduled for evening visit."
                        ))))
                .andExpect(status().isOk());

        // 1. Resident Home Dashboard
        MvcResult dashRes = mockMvc.perform(get("/residents/me/dashboard")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assignedRoom.propertyName", is("Emerald Co-Living")))
                .andExpect(jsonPath("$.data.assignedRoom.roomNumber", is("204")))
                .andExpect(jsonPath("$.data.assignedRoom.bedNumber", is("204-A")))
                .andExpect(jsonPath("$.data.assignedRoom.hasAttachedBathroom", is(true)))
                .andExpect(jsonPath("$.data.assignedRoom.hasBalcony", is(true)))
                .andExpect(jsonPath("$.data.assignedRoom.agreedMonthlyRent", is(12000)))
                .andExpect(jsonPath("$.data.pendingInvoicesCount", is(1)))
                .andExpect(jsonPath("$.data.openComplaintsCount", is(1)))
                .andExpect(jsonPath("$.data.activeAnnouncementsCount", is(1)))
                .andReturn();
        JsonNode dashData = extractData(dashRes);
        assertEquals(0, new BigDecimal("12500").compareTo(new BigDecimal(dashData.path("outstandingBalance").asText())));

        // 2-6. Assigned PG property, room, bed, rent, due date
        mockMvc.perform(get("/residents/me/room")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.propertyEmergencyContact", is("+919900001122")))
                .andExpect(jsonPath("$.data.defaultBillingDay", is(5)))
                .andExpect(jsonPath("$.data.gracePeriodDays", is(3)))
                .andExpect(jsonPath("$.data.lateFeeAmount", is(250)))
                .andExpect(jsonPath("$.data.nextDueDate", is(notNullValue())));

        // 7. Invoices strictly scoped to res1
        mockMvc.perform(get("/invoices/search?page=0&size=20")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)));

        mockMvc.perform(get("/invoices/" + res1CurrInvoiceId)
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalAmount", is(12500)));

        // Cannot inspect another resident's invoice
        mockMvc.perform(get("/invoices/" + res2PastInvoiceId)
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isNotFound());

        // 8-9. Payment History + View JSON Receipt + Download HTML Receipt + Isolation
        mockMvc.perform(get("/payments/search?page=0&size=20")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.items[0].referenceNumber", is("UPI-REF-8811")));

        mockMvc.perform(get("/payments/" + res1PaymentId + "/receipt")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.propertyName", is("Emerald Co-Living")))
                .andExpect(jsonPath("$.data.roomNumber", is("204")))
                .andExpect(jsonPath("$.data.bedNumber", is("204-A")))
                .andExpect(jsonPath("$.data.residentName", is("Rohan Sharma")))
                .andExpect(jsonPath("$.data.amount", is(12600)))
                .andExpect(jsonPath("$.data.paymentMethod", is("UPI_MANUAL")));

        MvcResult dlResult = mockMvc.perform(get("/payments/" + res1PaymentId + "/receipt/download")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("attachment; filename=")))
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andReturn();
        String receiptHtml = dlResult.getResponse().getContentAsString();
        assertTrue(receiptHtml.contains("Emerald Co-Living"));
        assertTrue(receiptHtml.contains("Rohan Sharma"));
        assertTrue(receiptHtml.contains("UPI-REF-8811"));

        // res1 CANNOT view or download res2's receipt
        mockMvc.perform(get("/payments/" + res2PaymentId + "/receipt")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/payments/" + res2PaymentId + "/receipt/download")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isNotFound());

        // 10-11. Track complaint status & owner resolution notes
        mockMvc.perform(get("/complaints/search?status=IN_PROGRESS&page=0&size=10")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.items[0].resolutionNotes", is("Plumber scheduled for evening visit.")));

        // 12. View announcements scoped strictly to own PG/owner
        mockMvc.perform(get("/announcements/search?page=0&size=20")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.items[0].title", is("Weekend Deep Cleaning")));

        // 13. View weekly food menu persisted in DB (with updated MONDAY menu)
        mockMvc.perform(get("/food-menu")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(7)))
                .andExpect(jsonPath("$.data[0].day", is("Monday")))
                .andExpect(jsonPath("$.data[0].breakfast", is("Masala Dosa & Filter Coffee")))
                .andExpect(jsonPath("$.data[0].snacks", is("Samosa & Ginger Tea")));

        // 14. View and update allowed self-profile fields (account fullName via /users/me, emergency/occupation via /residents/me)
        mockMvc.perform(put("/residents/me")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "occupation", "Senior QA Engineer",
                                "emergencyContactName", "Anil Sharma",
                                "emergencyContactPhone", "+919811112222",
                                "permanentAddress", "42 Civil Lines, Jaipur"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName", is("Rohan Sharma")))
                .andExpect(jsonPath("$.data.occupation", is("Senior QA Engineer")))
                .andExpect(jsonPath("$.data.emergencyContactName", is("Anil Sharma")));

        // Strict Read-Only Security: Residents CANNOT mutate rent, bed allocations, invoices, payments, complaint status, KYC, or menu!
        mockMvc.perform(post("/invoices/generate-monthly")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"billingMonth\":\"2026-12-01\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/payments")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "invoiceId", res1CurrInvoiceId,
                                "paymentMethod", "CASH",
                                "amount", 12500,
                                "idempotencyKey", "hack-pay"
                        ))))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/bookings/" + res2BookingId + "/rent")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"agreedMonthlyRent\":100}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/complaints/" + complaintId + "/status")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/food-menu")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "dayOfWeek", "MONDAY",
                                "breakfast", "Unauthorized",
                                "lunch", "Unauthorized",
                                "dinner", "Unauthorized"
                        ))))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/residents/" + res1Node.path("id").asText() + "/verify-kyc")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/announcements")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Fake\",\"content\":\"Notice\"}"))
                .andExpect(status().isForbidden());
    }

    private String findInvoiceIdByResident(JsonNode listNode, String residentUserId) {
        for (JsonNode item : listNode) {
            if (residentUserId.equals(item.path("residentId").asText())) {
                return item.path("id").asText();
            }
        }
        throw new IllegalStateException("Invoice not found for resident " + residentUserId);
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
                                "state", "Karnataka",
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
            AuthSession owner,
            String propertyId,
            String roomNumber,
            int floor,
            String sharingType,
            int rent,
            boolean attachedBathroom,
            boolean balcony) throws Exception {
        return extractId(mockMvc.perform(post("/rooms")
                        .header("Authorization", "Bearer " + owner.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "propertyId", propertyId,
                                "roomNumber", roomNumber,
                                "floorNumber", floor,
                                "sharingType", sharingType,
                                "baseMonthlyRent", rent,
                                "hasAttachedBathroom", attachedBathroom,
                                "hasBalcony", balcony
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
