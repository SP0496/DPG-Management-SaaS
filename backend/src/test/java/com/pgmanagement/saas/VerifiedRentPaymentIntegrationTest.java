package com.pgmanagement.saas;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class VerifiedRentPaymentIntegrationTest extends AbstractIntegrationTest {

    @Test
    void completeVerifiedDirectPaymentFlowPdfDownloadsNotificationsAndFilters() throws Exception {
        AuthSession owner1 = authenticateAllowlistedOwnerOne();
        AuthSession owner2 = authenticateAllowlistedOwnerTwo();

        // Owner 1 configures direct UPI and bank account details (no payment gateway)
        mockMvc.perform(put("/owners/me")
                        .header("Authorization", "Bearer " + owner1.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "businessName", "Emerald Living PG",
                                "upiId", "emeraldpg@okicici",
                                "upiPayeeName", "Emerald Living PG",
                                "bankAccountHolder", "Primary PG Owner",
                                "bankName", "ICICI Bank",
                                "bankAccountNumber", "123456789012",
                                "bankIfscCode", "ICIC0001234"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.upiId", is("emeraldpg@okicici")))
                .andExpect(jsonPath("$.data.bankIfscCode", is("ICIC0001234")));

        String propId = createProperty(owner1, "Emerald Heights", "Bengaluru");
        String roomId = createRoom(owner1, propId, "302", 3, "DOUBLE", 12000);
        String bedAId = addBed(owner1, roomId, "302-A");
        String bedBId = addBed(owner1, roomId, "302-B");

        JsonNode res1 = onboardResident(owner1, "+919881000001", "Vikram Nair");
        JsonNode res2 = onboardResident(owner1, "+919881000002", "Kiran Rao");

        String booking1Id = createBooking(owner1, res1.path("userId").asText(), bedAId, 12000);
        createBooking(owner1, res2.path("userId").asText(), bedBId, 12000);

        AuthSession res1Session = authenticateWithFirebase("uid-vikram", "+919881000001", null, null, null);
        AuthSession res2Session = authenticateWithFirebase("uid-kiran", "+919881000002", null, null, null);

        // 1. Generate monthly invoices (fixed rent 12000 + additional charges 650 = 12650, stored in integer paise)
        LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
        MvcResult genRes = mockMvc.perform(post("/invoices/generate-monthly")
                        .header("Authorization", "Bearer " + owner1.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "billingMonth", currentMonth.toString(),
                                "propertyId", propId,
                                "utilityCharges", 650,
                                "notes", "Monthly rent + water/power"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.createdCount", is(2)))
                .andReturn();

        JsonNode generatedList = objectMapper.readTree(genRes.getResponse().getContentAsString())
                .path("data").path("generatedInvoices");
        String res1InvoiceId = findInvoiceIdByResident(generatedList, res1.path("userId").asText());
        String res2InvoiceId = findInvoiceIdByResident(generatedList, res2.path("userId").asText());

        // 2. Resident fetches invoice & owner direct payment details
        mockMvc.perform(get("/payments/resident/checkout-details/" + res1InvoiceId)
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fixedMonthlyRentPaise", is(1200000)))
                .andExpect(jsonPath("$.data.additionalChargesPaise", is(65000)))
                .andExpect(jsonPath("$.data.totalAmountPaise", is(1265000)))
                .andExpect(jsonPath("$.data.outstandingAmountPaise", is(1265000)))
                .andExpect(jsonPath("$.data.ownerUpiId", is("emeraldpg@okicici")))
                .andExpect(jsonPath("$.data.bankName", is("ICICI Bank")))
                .andExpect(jsonPath("$.data.bankIfscCode", is("ICIC0001234")))
                .andExpect(jsonPath("$.data.upiDeepLink", containsString("upi://pay?pa=emeraldpg%40okicici")))
                .andExpect(jsonPath("$.data.bankVerificationAvailable", is(false)))
                .andExpect(jsonPath("$.data.items", hasSize(2)));

        // 3. Resident submits UPI Intent payment -> strictly PENDING_VERIFICATION (NEVER auto-confirmed!)
        MvcResult submitUpiRes = mockMvc.perform(post("/payments/submissions")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "invoiceId", res1InvoiceId,
                                "paymentMethod", "UPI_INTENT",
                                "amount", 12650,
                                "utrReference", "UTR431988123456",
                                "payerUpiId", "vikram@okaxis",
                                "payerName", "Vikram Nair",
                                "paymentDate", LocalDate.now().toString(),
                                "idempotencyKey", "idem-vikram-1",
                                "notes", "Paid via UPI intent"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("PENDING_VERIFICATION")))
                .andExpect(jsonPath("$.data.amountPaise", is(1265000)))
                .andExpect(jsonPath("$.data.receiptNumber").doesNotExist())
                .andReturn();

        String sub1Id = objectMapper.readTree(submitUpiRes.getResponse().getContentAsString()).path("data").path("id").asText();

        // Resident cannot submit tampered overpayment (> remaining balance) or manipulate rent/invoices
        mockMvc.perform(post("/payments/submissions")
                        .header("Authorization", "Bearer " + res2Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "invoiceId", res2InvoiceId,
                                "paymentMethod", "NEFT",
                                "amount", 99999,
                                "utrReference", "TAMPER123456",
                                "idempotencyKey", "idem-tamper-amt"
                        ))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/invoices/generate-monthly")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "billingMonth", currentMonth.toString(),
                                "propertyId", propId
                        ))))
                .andExpect(status().isForbidden());

        // 5. While PENDING_VERIFICATION, invoice balance must NOT drop and paid receipt PDF must fail!
        mockMvc.perform(get("/invoices/" + res1InvoiceId)
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ISSUED")))
                .andExpect(jsonPath("$.data.paidAmount", is(0)));

        mockMvc.perform(get("/payments/submissions/" + sub1Id + "/receipt/pdf")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isBadRequest());

        // 9. Idempotency replay returns same submission; duplicate UTR with new idempotency key fails (409)
        mockMvc.perform(post("/payments/submissions")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "invoiceId", res1InvoiceId,
                                "paymentMethod", "UPI_INTENT",
                                "amount", 12650,
                                "utrReference", "UTR431988123456",
                                "idempotencyKey", "idem-vikram-1"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id", is(sub1Id)));

        mockMvc.perform(post("/payments/submissions")
                        .header("Authorization", "Bearer " + res2Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "invoiceId", res2InvoiceId,
                                "paymentMethod", "NEFT",
                                "amount", 12650,
                                "utrReference", "utr431988123456",
                                "bankName", "HDFC Bank",
                                "idempotencyKey", "idem-kiran-dup-utr"
                        ))))
                .andExpect(status().isConflict());

        // 4. Resident 2 submits NEFT bank transfer with fresh UTR -> PENDING_VERIFICATION
        MvcResult submitNeftRes = mockMvc.perform(post("/payments/submissions")
                        .header("Authorization", "Bearer " + res2Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "invoiceId", res2InvoiceId,
                                "paymentMethod", "NEFT",
                                "amount", 12650,
                                "utrReference", "NEFT9900112233",
                                "bankName", "HDFC Bank",
                                "paymentDate", LocalDate.now().toString(),
                                "idempotencyKey", "idem-kiran-neft-1"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("PENDING_VERIFICATION")))
                .andReturn();
        String sub2Id = objectMapper.readTree(submitNeftRes.getResponse().getContentAsString()).path("data").path("id").asText();

        // 6. Owner notification received, unread count accurate, mark as read works
        mockMvc.perform(get("/notifications/unread-count")
                        .header("Authorization", "Bearer " + owner1.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", is(2)));

        MvcResult ownerNotifRes = mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + owner1.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].targetType", is("PAYMENT_SUBMISSION")))
                .andExpect(jsonPath("$.data[0].transactionSubmissionId", notNullValue()))
                .andExpect(jsonPath("$.data[0].read", is(false)))
                .andReturn();

        String firstNotifId = objectMapper.readTree(ownerNotifRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asText();

        mockMvc.perform(patch("/notifications/" + firstNotifId + "/read")
                        .header("Authorization", "Bearer " + owner1.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.read", is(true)));

        // 14 & 15. Strict isolation checks (resident cannot confirm/reject; resident2 cannot see res1; owner2 isolated)
        mockMvc.perform(post("/payments/submissions/" + sub1Id + "/confirm")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/payments/submissions/" + sub1Id)
                        .header("Authorization", "Bearer " + res2Session.accessToken()))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/payments/resident/checkout-details/" + res1InvoiceId)
                        .header("Authorization", "Bearer " + res2Session.accessToken()))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/payments/submissions/" + sub1Id + "/confirm")
                        .header("Authorization", "Bearer " + owner2.accessToken()))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/payments/ledger")
                        .header("Authorization", "Bearer " + owner2.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));

        // 7. Owner confirms submission 1 -> CONFIRMED, invoice becomes PAID, receipt issued, dashboard & ledger updated
        MvcResult confirmRes = mockMvc.perform(post("/payments/submissions/" + sub1Id + "/confirm")
                        .header("Authorization", "Bearer " + owner1.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"remarks\":\"Verified against ICICI bank statement\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CONFIRMED")))
                .andExpect(jsonPath("$.data.receiptNumber", notNullValue()))
                .andExpect(jsonPath("$.data.remainingBalancePaise", is(0)))
                .andExpect(jsonPath("$.data.verificationSource", is("OWNER_MANUAL_RECONCILIATION")))
                .andReturn();
        String payment1Id = objectMapper.readTree(confirmRes.getResponse().getContentAsString())
                .path("data").path("paymentId").asText();

        mockMvc.perform(get("/invoices/" + res1InvoiceId)
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PAID")))
                .andExpect(jsonPath("$.data.balanceDue", is(0)));

        mockMvc.perform(get("/owners/dashboard")
                        .header("Authorization", "Bearer " + owner1.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.expectedMonthlyRent", is(24000)))
                .andExpect(jsonPath("$.data.collectedThisMonth", is(12650)))
                .andExpect(jsonPath("$.data.pendingRentTotal", is(12650)))
                .andExpect(jsonPath("$.data.paidResidentsCount", is(1)))
                .andExpect(jsonPath("$.data.pendingResidentsCount", is(1)))
                .andExpect(jsonPath("$.data.pendingVerificationCount", is(1)));

        mockMvc.perform(get("/payments/ledger")
                        .param("propertyId", propId)
                        .param("floorNumber", "3")
                        .param("roomNumber", "302")
                        .param("status", "CONFIRMED")
                        .header("Authorization", "Bearer " + owner1.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].referenceNumber", is("UTR431988123456")))
                .andExpect(jsonPath("$.data[0].residentName", is("Vikram Nair")));

        // 8. Owner rejects submission 2 -> REJECTED; balance unpaid; resident 2 retries with valid UTR and gets confirmed
        mockMvc.perform(post("/payments/submissions/" + sub2Id + "/reject")
                        .header("Authorization", "Bearer " + owner1.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"UTR not matched in today NEFT batch\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("REJECTED")));

        mockMvc.perform(get("/payments/submissions/" + sub2Id + "/receipt/pdf")
                        .header("Authorization", "Bearer " + res2Session.accessToken()))
                .andExpect(status().isBadRequest());

        MvcResult retryRes = mockMvc.perform(post("/payments/submissions")
                        .header("Authorization", "Bearer " + res2Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "invoiceId", res2InvoiceId,
                                "paymentMethod", "IMPS",
                                "amount", 12650,
                                "utrReference", "IMPS7788990011",
                                "bankName", "HDFC Bank",
                                "idempotencyKey", "idem-kiran-retry-2"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("PENDING_VERIFICATION")))
                .andReturn();
        String retrySub2Id = objectMapper.readTree(retryRes.getResponse().getContentAsString()).path("data").path("id").asText();

        mockMvc.perform(post("/payments/submissions/" + retrySub2Id + "/confirm")
                        .header("Authorization", "Bearer " + owner1.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"remarks\":\"Verified IMPS credit\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CONFIRMED")));

        // 12 & 13. Invoice PDF & Receipt PDF download produce real %PDF bytes (and block cross-resident access)
        MvcResult invoicePdfRes = mockMvc.perform(get("/invoices/" + res1InvoiceId + "/pdf")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("application/pdf")))
                .andReturn();
        byte[] invPdfBytes = invoicePdfRes.getResponse().getContentAsByteArray();
        assertTrue(invPdfBytes.length > 200);
        assertEquals("%PDF-", new String(invPdfBytes, 0, 5, StandardCharsets.US_ASCII));

        MvcResult receiptPdfRes = mockMvc.perform(get("/payments/submissions/" + sub1Id + "/receipt/pdf")
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("application/pdf")))
                .andReturn();
        byte[] rcptPdfBytes = receiptPdfRes.getResponse().getContentAsByteArray();
        assertTrue(rcptPdfBytes.length > 200);
        assertEquals("%PDF-", new String(rcptPdfBytes, 0, 5, StandardCharsets.US_ASCII));

        mockMvc.perform(get("/payments/" + payment1Id + "/receipt/pdf")
                        .header("Authorization", "Bearer " + owner1.accessToken()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("application/pdf")));

        mockMvc.perform(get("/invoices/" + res1InvoiceId + "/pdf")
                        .header("Authorization", "Bearer " + res2Session.accessToken()))
                .andExpect(status().isNotFound());

        // 10 & 11. Room base rent hike does NOT change active resident's fixed agreed rent; effective-date revision does after acceptance
        mockMvc.perform(put("/rooms/" + roomId)
                        .header("Authorization", "Bearer " + owner1.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "propertyId", propId,
                                "roomNumber", "302",
                                "floorNumber", 3,
                                "sharingType", "DOUBLE",
                                "baseMonthlyRent", 15500,
                                "hasAttachedBathroom", true,
                                "hasBalcony", true
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.baseMonthlyRent", is(15500)));

        LocalDate nextMonth = currentMonth.plusMonths(1);
        MvcResult nextMonthGen = mockMvc.perform(post("/invoices/generate-monthly")
                        .header("Authorization", "Bearer " + owner1.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "billingMonth", nextMonth.toString(),
                                "propertyId", propId,
                                "utilityCharges", 0
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode nextMonthInvoices = objectMapper.readTree(nextMonthGen.getResponse().getContentAsString())
                .path("data").path("generatedInvoices");
        assertEquals(1200000L, nextMonthInvoices.get(0).path("baseRentPaise").asLong());

        // Propose rent revision effective 2 months from now + resident accepts -> future invoice uses revised rent
        LocalDate effectiveMonth = currentMonth.plusMonths(2);
        MvcResult propRevRes = mockMvc.perform(post("/bookings/" + booking1Id + "/rent-revisions")
                        .header("Authorization", "Bearer " + owner1.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "proposedMonthlyRent", 13200,
                                "effectiveDate", effectiveMonth.toString(),
                                "reason", "Annual 10% renewal increment"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("PENDING_RESIDENT_ACCEPTANCE")))
                .andReturn();
        String revisionId = objectMapper.readTree(propRevRes.getResponse().getContentAsString())
                .path("data").path("id").asText();

        mockMvc.perform(post("/bookings/rent-revisions/" + revisionId + "/respond")
                        .header("Authorization", "Bearer " + res1Session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":true,\"remarks\":\"Agreed for renewal\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACCEPTED")));

        MvcResult effMonthGen = mockMvc.perform(post("/invoices/generate-monthly")
                        .header("Authorization", "Bearer " + owner1.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "billingMonth", effectiveMonth.toString(),
                                "propertyId", propId,
                                "utilityCharges", 0
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode effInvoices = objectMapper.readTree(effMonthGen.getResponse().getContentAsString())
                .path("data").path("generatedInvoices");
        String vikramEffInvId = findInvoiceIdByResident(effInvoices, res1.path("userId").asText());
        mockMvc.perform(get("/invoices/" + vikramEffInvId)
                        .header("Authorization", "Bearer " + res1Session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.baseRentPaise", is(1320000)));
    }

    private String findInvoiceIdByResident(JsonNode listNode, String residentUserId) {
        for (JsonNode item : listNode) {
            if (residentUserId.equals(item.path("residentId").asText())) {
                return item.path("id").asText();
            }
        }
        throw new IllegalStateException("Invoice not found for resident " + residentUserId);
    }

    private String createProperty(AuthSession owner, String name, String city) throws Exception {
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
                                "defaultBillingDay", 5,
                                "gracePeriodDays", 3,
                                "lateFeeAmount", 250
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
                                "baseMonthlyRent", rent,
                                "hasAttachedBathroom", true,
                                "hasBalcony", false
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
