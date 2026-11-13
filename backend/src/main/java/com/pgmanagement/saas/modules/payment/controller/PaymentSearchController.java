package com.pgmanagement.saas.modules.payment.controller;

import com.pgmanagement.saas.modules.payment.dto.response.PaymentResponse;
import com.pgmanagement.saas.modules.payment.entity.PaymentMethod;
import com.pgmanagement.saas.modules.payment.service.PaymentService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Paginated payment search endpoints")
public class PaymentSearchController {

    private final PaymentService paymentService;

    @GetMapping("/search")
    @Operation(summary = "Search and paginate recorded payments scoped to owner or resident")
    public ResponseEntity<ApiResponse<PagedResponse<PaymentResponse>>> searchPayments(
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<PaymentResponse> result = paymentService.searchPayments(
                TenantContext.currentUserId(),
                TenantContext.currentRole(),
                paymentMethod,
                search,
                page,
                size
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
