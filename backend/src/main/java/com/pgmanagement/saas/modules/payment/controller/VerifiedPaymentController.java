package com.pgmanagement.saas.modules.payment.controller;

import com.pgmanagement.saas.modules.payment.dto.request.ConfirmPaymentSubmissionRequest;
import com.pgmanagement.saas.modules.payment.dto.request.RejectPaymentSubmissionRequest;
import com.pgmanagement.saas.modules.payment.dto.request.SubmitDirectPaymentRequest;
import com.pgmanagement.saas.modules.payment.dto.response.PaymentSubmissionResponse;
import com.pgmanagement.saas.modules.payment.dto.response.RentLedgerEntryResponse;
import com.pgmanagement.saas.modules.payment.dto.response.ResidentCheckoutDetailsResponse;
import com.pgmanagement.saas.modules.payment.entity.PaymentSubmissionStatus;
import com.pgmanagement.saas.modules.payment.service.VerifiedPaymentService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Tag(name = "Direct Rent Payments & Verification", description = "Direct UPI/bank transfer submission, owner verification reconciliation, and filtered rent ledger")
public class VerifiedPaymentController {

    private final VerifiedPaymentService verifiedPaymentService;

    @GetMapping("/resident/checkout-details/{invoiceId}")
    @PreAuthorize("hasRole('RESIDENT')")
    @Operation(summary = "Get invoice breakdown, owner direct UPI URI/details, and bank transfer info for direct payment")
    public ResponseEntity<ApiResponse<ResidentCheckoutDetailsResponse>> getCheckoutDetails(
            @PathVariable UUID invoiceId) {
        ResidentCheckoutDetailsResponse details = verifiedPaymentService.getResidentCheckoutDetails(
                invoiceId, TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(details));
    }

    @PostMapping("/submissions")
    @PreAuthorize("hasRole('RESIDENT')")
    @Operation(summary = "Submit UTR/reference details after paying directly to owner UPI or bank account (sets PENDING_VERIFICATION)")
    public ResponseEntity<ApiResponse<PaymentSubmissionResponse>> submitDirectPayment(
            @Valid @RequestBody SubmitDirectPaymentRequest request) {
        PaymentSubmissionResponse created = verifiedPaymentService.submitDirectPayment(
                TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Payment submitted and awaiting owner bank verification"));
    }

    @GetMapping("/submissions")
    @Operation(summary = "List and filter payment submissions scoped to authenticated owner or resident")
    public ResponseEntity<ApiResponse<List<PaymentSubmissionResponse>>> listSubmissions(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) Integer floorNumber,
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) UUID residentId,
            @RequestParam(required = false) String billingMonth,
            @RequestParam(required = false) PaymentSubmissionStatus status,
            @RequestParam(required = false) String search) {
        List<PaymentSubmissionResponse> items = verifiedPaymentService.listSubmissions(
                TenantContext.currentUserId(),
                TenantContext.currentRole(),
                propertyId,
                floorNumber,
                roomNumber,
                residentId,
                billingMonth,
                status,
                search
        );
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/submissions/{submissionId}")
    @Operation(summary = "Get single payment submission status scoped to authenticated owner or resident")
    public ResponseEntity<ApiResponse<PaymentSubmissionResponse>> getSubmission(
            @PathVariable UUID submissionId) {
        PaymentSubmissionResponse item = verifiedPaymentService.getSubmission(
                submissionId, TenantContext.currentUserId(), TenantContext.currentRole());
        return ResponseEntity.ok(ApiResponse.success(item));
    }

    @PostMapping("/submissions/{submissionId}/confirm")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Owner confirms direct payment against bank statement, marks invoice paid, and generates official receipt")
    public ResponseEntity<ApiResponse<PaymentSubmissionResponse>> confirmSubmission(
            @PathVariable UUID submissionId,
            @RequestBody(required = false) ConfirmPaymentSubmissionRequest request) {
        PaymentSubmissionResponse confirmed = verifiedPaymentService.confirmSubmission(
                submissionId, TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(confirmed, "Payment verified and confirmed successfully"));
    }

    @PostMapping("/submissions/{submissionId}/reject")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Owner rejects an unverified payment submission without crediting the invoice")
    public ResponseEntity<ApiResponse<PaymentSubmissionResponse>> rejectSubmission(
            @PathVariable UUID submissionId,
            @Valid @RequestBody RejectPaymentSubmissionRequest request) {
        PaymentSubmissionResponse rejected = verifiedPaymentService.rejectSubmission(
                submissionId, TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(rejected, "Payment submission rejected"));
    }

    @GetMapping(value = "/submissions/{submissionId}/receipt/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Download official verified payment receipt as PDF (fails unless CONFIRMED)")
    public ResponseEntity<byte[]> downloadSubmissionReceiptPdf(@PathVariable UUID submissionId) {
        byte[] pdf = verifiedPaymentService.generateSubmissionReceiptPdfBytes(
                submissionId, TenantContext.currentUserId(), TenantContext.currentRole());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("receipt-" + submissionId.toString().substring(0, 8) + ".pdf")
                .build());
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @GetMapping("/ledger")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Query filterable rent payment ledger table across owner's properties, floors, rooms, residents, months, and status")
    public ResponseEntity<ApiResponse<List<RentLedgerEntryResponse>>> getRentLedger(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) Integer floorNumber,
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) UUID residentId,
            @RequestParam(required = false) String billingMonth,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        List<RentLedgerEntryResponse> entries = verifiedPaymentService.getRentLedger(
                TenantContext.currentUserId(),
                propertyId,
                floorNumber,
                roomNumber,
                residentId,
                billingMonth,
                status,
                search
        );
        return ResponseEntity.ok(ApiResponse.success(entries));
    }
}
