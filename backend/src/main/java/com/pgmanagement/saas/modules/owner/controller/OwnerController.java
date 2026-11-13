package com.pgmanagement.saas.modules.owner.controller;

import com.pgmanagement.saas.modules.owner.dto.request.UpsertOwnerProfileRequest;
import com.pgmanagement.saas.modules.owner.dto.response.OwnerProfileResponse;
import com.pgmanagement.saas.modules.owner.service.OwnerService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/owners")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
@Tag(name = "Owners", description = "PG owner business profile and onboarding status endpoints")
public class OwnerController {

    private final OwnerService ownerService;

    @GetMapping("/me")
    @Operation(summary = "Get current PG owner business profile")
    public ResponseEntity<ApiResponse<OwnerProfileResponse>> getMyProfile() {
        OwnerProfileResponse profile = ownerService.getMyProfile(TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current PG owner business profile")
    public ResponseEntity<ApiResponse<OwnerProfileResponse>> updateMyProfile(
            @Valid @RequestBody UpsertOwnerProfileRequest request) {
        OwnerProfileResponse updated = ownerService.updateMyProfile(TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Owner profile updated"));
    }
}
