package com.pgmanagement.saas.modules.invoice.controller;

import com.pgmanagement.saas.modules.invoice.dto.request.CreateInvoiceRequest;
import com.pgmanagement.saas.modules.invoice.dto.response.InvoiceResponse;
import com.pgmanagement.saas.modules.invoice.service.InvoiceService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
@Tag(name = "Rent & Invoices", description = "Monthly rent billing and invoice lifecycle endpoints")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final VerifiedPaymentService verifiedPaymentService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Issue a rent invoice for an active owned booking")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @Valid @RequestBody CreateInvoiceRequest request) {
        InvoiceResponse created = invoiceService.createInvoice(TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Rent invoice issued successfully"));
    }

    @GetMapping
    @Operation(summary = "List rent invoices scoped to authenticated owner or resident")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> listInvoices() {
        List<InvoiceResponse> invoices = invoiceService.listInvoices(
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @GetMapping("/{invoiceId}")
    @Operation(summary = "Get invoice details scoped to owner or resident")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoice(@PathVariable UUID invoiceId) {
        InvoiceResponse invoice = invoiceService.getInvoice(
                invoiceId,
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @GetMapping(value = "/{invoiceId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Download rent invoice PDF scoped to authenticated owner or resident")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable UUID invoiceId) {
        byte[] pdf = verifiedPaymentService.generateInvoicePdfBytes(
                invoiceId,
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("invoice-" + invoiceId.toString().substring(0, 8) + ".pdf")
                .build());
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @PatchMapping("/{invoiceId}/cancel")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Cancel an unpaid rent invoice")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(@PathVariable UUID invoiceId) {
        InvoiceResponse cancelled = invoiceService.cancelInvoice(invoiceId, TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Invoice cancelled successfully"));
    }
}
