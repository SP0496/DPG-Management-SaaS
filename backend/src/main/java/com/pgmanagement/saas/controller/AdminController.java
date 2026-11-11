package com.pgmanagement.saas.controller;

import com.pgmanagement.saas.dto.response.ApiResponse;
import com.pgmanagement.saas.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Hardened Admin Controller.
 * Method-level security enforces strictly privileged access.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PROPERTY_ADMIN', 'SUPER_ADMIN')")
public class AdminController {

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminDashboard(
            @AuthenticationPrincipal UserPrincipal principal) {

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("organizationId", principal.getOrganizationId());
        metrics.put("activePropertiesCount", 3);
        metrics.put("totalOccupancyRate", 87.5);
        metrics.put("pendingRentDues", 45000.00);
        metrics.put("openMaintenanceTickets", 2);

        return ResponseEntity.ok(ApiResponse.success(metrics, "Dashboard metrics retrieved successfully"));
    }
}
