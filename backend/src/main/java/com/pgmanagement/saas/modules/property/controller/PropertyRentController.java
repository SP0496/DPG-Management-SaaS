package com.pgmanagement.saas.modules.property.controller;

import com.pgmanagement.saas.modules.property.dto.request.UpdateRentConfigRequest;
import com.pgmanagement.saas.modules.property.dto.response.PropertyResponse;
import com.pgmanagement.saas.modules.property.service.PropertyService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/properties")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
@Tag(name = "Properties", description = "Paginated property search and rent configuration endpoints")
public class PropertyRentController {

    private final PropertyService propertyService;

    @GetMapping("/search")
    @Operation(summary = "Search and paginate active PG properties owned by the authenticated owner")
    public ResponseEntity<ApiResponse<PagedResponse<PropertyResponse>>> searchProperties(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<PropertyResponse> result = propertyService.searchOwnerProperties(
                TenantContext.currentUserId(), search, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PatchMapping("/{id}/rent-config")
    @Operation(summary = "Configure default monthly billing day, grace period, and late fee for a PG property")
    public ResponseEntity<ApiResponse<PropertyResponse>> updateRentConfig(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRentConfigRequest request) {
        PropertyResponse updated = propertyService.updateRentConfig(id, TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Rent configuration updated"));
    }
}
