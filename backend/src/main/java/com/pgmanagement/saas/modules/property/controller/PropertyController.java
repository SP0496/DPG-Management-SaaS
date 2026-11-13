package com.pgmanagement.saas.modules.property.controller;

import com.pgmanagement.saas.modules.property.dto.request.PropertyRequest;
import com.pgmanagement.saas.modules.property.dto.response.PropertyResponse;
import com.pgmanagement.saas.modules.property.service.PropertyService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/properties")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
@Tag(name = "Properties", description = "Owner-scoped PG property management endpoints")
public class PropertyController {

    private final PropertyService propertyService;

    @PostMapping
    @Operation(summary = "Create a new PG property owned by the authenticated owner")
    public ResponseEntity<ApiResponse<PropertyResponse>> createProperty(
            @Valid @RequestBody PropertyRequest request) {
        PropertyResponse created = propertyService.createProperty(TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Property created successfully"));
    }

    @GetMapping
    @Operation(summary = "List active PG properties owned by the authenticated owner")
    public ResponseEntity<ApiResponse<List<PropertyResponse>>> listProperties() {
        List<PropertyResponse> properties = propertyService.listOwnerProperties(TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(properties));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get PG property details scoped to the authenticated owner")
    public ResponseEntity<ApiResponse<PropertyResponse>> getProperty(@PathVariable UUID id) {
        PropertyResponse property = propertyService.getOwnedProperty(id, TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(property));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update PG property details scoped to the authenticated owner")
    public ResponseEntity<ApiResponse<PropertyResponse>> updateProperty(
            @PathVariable UUID id,
            @Valid @RequestBody PropertyRequest request) {
        PropertyResponse updated = propertyService.updateProperty(id, TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Property updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate PG property scoped to the authenticated owner")
    public ResponseEntity<ApiResponse<Void>> deactivateProperty(@PathVariable UUID id) {
        propertyService.deactivateProperty(id, TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.ok("Property deactivated successfully"));
    }
}
