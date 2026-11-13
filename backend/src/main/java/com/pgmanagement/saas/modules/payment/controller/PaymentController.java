package com.pgmanagement.saas.modules.payment.controller;

import com.pgmanagement.saas.modules.payment.dto.request.RecordPaymentRequest;
import com.pgmanagement.saas.modules.payment.dto.response.PaymentResponse;
import com.pgmanagement.saas.modules.payment.service.PaymentService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment ledger foundation endpoints (manual settlements; gateway integration deferred)")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Record a manual rent payment against an owned invoice")
    public ResponseEntity<ApiResponse<PaymentResponse>> recordPayment(
            @Valid @RequestBody RecordPaymentRequest request) {
        PaymentResponse recorded = paymentService.recordPayment(TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(recorded, "Payment recorded successfully"));
    }

    @GetMapping
    @Operation(summary = "List payment records scoped to authenticated owner or resident")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> listPayments() {
        List<PaymentResponse> payments = paymentService.listPayments(
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/{paymentId}")
    @Operation(summary = "Get payment details scoped to owner or resident")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(@PathVariable UUID paymentId) {
        PaymentResponse payment = paymentService.getPayment(
                paymentId,
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        return ResponseEntity.ok(ApiResponse.success(payment));
    }
}
