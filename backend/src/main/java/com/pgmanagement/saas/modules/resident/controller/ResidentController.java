package com.pgmanagement.saas.modules.resident.controller;

import com.pgmanagement.saas.modules.booking.service.BookingService;
import com.pgmanagement.saas.modules.resident.dto.request.OnboardResidentRequest;
import com.pgmanagement.saas.modules.resident.dto.request.UpsertResidentProfileRequest;
import com.pgmanagement.saas.modules.resident.dto.response.ResidentAssignedRoomResponse;
import com.pgmanagement.saas.modules.resident.dto.response.ResidentDashboardResponse;
import com.pgmanagement.saas.modules.resident.dto.response.ResidentProfileResponse;
import com.pgmanagement.saas.modules.resident.service.ResidentDashboardService;
import com.pgmanagement.saas.modules.resident.service.ResidentService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/residents")
@RequiredArgsConstructor
@Tag(name = "Residents", description = "Resident onboarding, KYC, and profile management endpoints")
public class ResidentController {

    private final ResidentService residentService;
    private final BookingService bookingService;
    private final ResidentDashboardService residentDashboardService;

    @GetMapping("/me/dashboard")
    @PreAuthorize("hasRole('RESIDENT')")
    @Operation(summary = "Get aggregated live home dashboard for current resident")
    public ResponseEntity<ApiResponse<ResidentDashboardResponse>> getMyDashboard() {
        ResidentDashboardResponse response = residentDashboardService.getDashboard(TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('RESIDENT')")
    @Operation(summary = "Get current resident profile")
    public ResponseEntity<ApiResponse<ResidentProfileResponse>> getMyProfile() {
        ResidentProfileResponse response = residentService.getMyProfile(TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me/room")
    @PreAuthorize("hasRole('RESIDENT')")
    @Operation(summary = "Get assigned property, room, bed, and booking details for current resident")
    public ResponseEntity<ApiResponse<ResidentAssignedRoomResponse>> getMyAssignedRoom() {
        ResidentAssignedRoomResponse response = bookingService.getAssignedRoomForResident(TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('RESIDENT')")
    @Operation(summary = "Update current resident emergency and KYC profile")
    public ResponseEntity<ApiResponse<ResidentProfileResponse>> updateMyProfile(
            @Valid @RequestBody UpsertResidentProfileRequest request) {
        ResidentProfileResponse response = residentService.updateMyProfile(TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Resident profile updated"));
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Onboard a new PG resident scoped to the authenticated owner")
    public ResponseEntity<ApiResponse<ResidentProfileResponse>> onboardResident(
            @Valid @RequestBody OnboardResidentRequest request) {
        ResidentProfileResponse created = residentService.onboardResident(TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Resident onboarded successfully"));
    }

    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "List all residents managed by the authenticated owner")
    public ResponseEntity<ApiResponse<List<ResidentProfileResponse>>> listOwnerResidents() {
        List<ResidentProfileResponse> list = residentService.listResidentsByOwner(TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Search and paginate residents managed by the authenticated owner")
    public ResponseEntity<ApiResponse<PagedResponse<ResidentProfileResponse>>> searchOwnerResidents(
            @RequestParam(required = false) Boolean kycVerified,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<ResidentProfileResponse> result = residentService.searchResidentsByOwner(
                TenantContext.currentUserId(), kycVerified, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Get resident details belonging to the authenticated owner")
    public ResponseEntity<ApiResponse<ResidentProfileResponse>> getResident(@PathVariable UUID id) {
        ResidentProfileResponse response = residentService.getResidentForOwner(id, TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/verify-kyc")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Mark resident KYC details verified by owner")
    public ResponseEntity<ApiResponse<ResidentProfileResponse>> verifyKyc(@PathVariable UUID id) {
        ResidentProfileResponse response = residentService.verifyResidentKyc(id, TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(response, "Resident KYC verified"));
    }
}
