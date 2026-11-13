package com.pgmanagement.saas.modules.invoice.controller;

import com.pgmanagement.saas.modules.invoice.dto.request.GenerateMonthlyInvoicesRequest;
import com.pgmanagement.saas.modules.invoice.dto.response.GenerateMonthlyInvoicesResponse;
import com.pgmanagement.saas.modules.invoice.dto.response.InvoiceResponse;
import com.pgmanagement.saas.modules.invoice.entity.InvoiceStatus;
import com.pgmanagement.saas.modules.invoice.service.InvoiceService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
@Tag(name = "Rent & Invoices", description = "Monthly batch invoice generation, overdue tracking, and search endpoints")
public class InvoiceActionsController {

    private final InvoiceService invoiceService;

    @PostMapping("/generate-monthly")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Idempotently generate monthly rent invoices for all open bookings of an owner or property")
    public ResponseEntity<ApiResponse<GenerateMonthlyInvoicesResponse>> generateMonthly(
            @Valid @RequestBody GenerateMonthlyInvoicesRequest request) {
        GenerateMonthlyInvoicesResponse response = invoiceService.generateMonthlyInvoices(
                TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Monthly rent invoices processed"));
    }

    @PostMapping("/mark-overdue")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Evaluate due dates plus property grace period and mark unpaid invoices OVERDUE")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> markOverdue() {
        List<InvoiceResponse> marked = invoiceService.markOverdueInvoices(TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(marked, "Overdue evaluation complete"));
    }

    @GetMapping("/search")
    @Operation(summary = "Search and paginate invoices scoped to owner or resident with status and overdue filters")
    public ResponseEntity<ApiResponse<PagedResponse<InvoiceResponse>>> searchInvoices(
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(defaultValue = "false") boolean overdueOnly,
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<InvoiceResponse> result = invoiceService.searchInvoices(
                TenantContext.currentUserId(),
                TenantContext.currentRole(),
                status,
                overdueOnly,
                propertyId,
                search,
                page,
                size
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
