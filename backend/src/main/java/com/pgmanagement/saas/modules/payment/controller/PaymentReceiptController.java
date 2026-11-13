package com.pgmanagement.saas.modules.payment.controller;

import com.pgmanagement.saas.modules.payment.dto.response.PaymentReceiptResponse;
import com.pgmanagement.saas.modules.payment.service.PaymentService;
import com.pgmanagement.saas.modules.payment.service.VerifiedPaymentService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Tag(name = "Payment Receipts", description = "Verified rent receipt preview and download endpoints")
public class PaymentReceiptController {

    private final PaymentService paymentService;
    private final VerifiedPaymentService verifiedPaymentService;

    @GetMapping("/{id}/receipt")
    @Operation(summary = "Get structured rent receipt for a payment scoped to owner or resident")
    public ResponseEntity<ApiResponse<PaymentReceiptResponse>> getPaymentReceipt(@PathVariable UUID id) {
        PaymentReceiptResponse receipt = paymentService.getPaymentReceipt(
                id,
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        return ResponseEntity.ok(ApiResponse.success(receipt));
    }

    @GetMapping(value = "/{id}/receipt/download", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Download printable HTML rent receipt attachment scoped to owner or resident")
    public ResponseEntity<byte[]> downloadPaymentReceipt(@PathVariable UUID id) {
        PaymentReceiptResponse receipt = paymentService.getPaymentReceipt(
                id,
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        String html = paymentService.renderReceiptHtml(receipt);
        String filename = "receipt-" + receipt.getReceiptNumber() + ".html";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType(MediaType.TEXT_HTML, StandardCharsets.UTF_8));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());

        return ResponseEntity.ok()
                .headers(headers)
                .body(html.getBytes(StandardCharsets.UTF_8));
    }

    @GetMapping(value = "/{id}/receipt/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Download official verified rent receipt PDF scoped to owner or resident")
    public ResponseEntity<byte[]> downloadPaymentReceiptPdf(@PathVariable UUID id) {
        byte[] pdf = verifiedPaymentService.generatePaymentReceiptPdfBytes(
                id,
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("receipt-" + id.toString().substring(0, 8) + ".pdf")
                .build());
        return ResponseEntity.ok().headers(headers).body(pdf);
    }
}
