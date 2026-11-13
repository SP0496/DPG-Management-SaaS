package com.pgmanagement.saas.modules.owner.controller;

import com.pgmanagement.saas.modules.owner.dto.response.OwnerDashboardResponse;
import com.pgmanagement.saas.modules.owner.service.OwnerDashboardService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/owners")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
@Tag(name = "Owners", description = "Live dashboard statistics for PG owners")
public class OwnerDashboardController {

    private final OwnerDashboardService ownerDashboardService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get live portfolio occupancy, residents, invoices, collections, and complaints statistics")
    public ResponseEntity<ApiResponse<OwnerDashboardResponse>> getDashboard() {
        OwnerDashboardResponse response = ownerDashboardService.getDashboardStats(TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
