package com.pgmanagement.saas.controller;

import com.pgmanagement.saas.dto.request.TenantOnboardRequest;
import com.pgmanagement.saas.dto.response.ApiResponse;
import com.pgmanagement.saas.entity.TenantStay;
import com.pgmanagement.saas.security.UserPrincipal;
import com.pgmanagement.saas.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping("/onboard")
    @PreAuthorize("hasAnyRole('PROPERTY_ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<TenantStay>> onboardTenant(
            @Valid @RequestBody TenantOnboardRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TenantStay stay = tenantService.onboardTenant(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(stay, "Tenant onboarded and bed assigned successfully"));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('PROPERTY_ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<TenantStay>>> getActiveStays(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TenantStay> stays = tenantService.getActiveStaysForOrganization(principal);
        return ResponseEntity.ok(ApiResponse.success(stays));
    }
}
