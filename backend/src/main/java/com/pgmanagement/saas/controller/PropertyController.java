package com.pgmanagement.saas.controller;

import com.pgmanagement.saas.dto.request.PropertyCreateRequest;
import com.pgmanagement.saas.dto.response.ApiResponse;
import com.pgmanagement.saas.entity.Property;
import com.pgmanagement.saas.security.UserPrincipal;
import com.pgmanagement.saas.service.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PROPERTY_ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<Property>>> getProperties(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Property> properties = propertyService.getPropertiesForOrganization(principal);
        return ResponseEntity.ok(ApiResponse.success(properties));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPERTY_ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Property>> getPropertyById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Property property = propertyService.getPropertyById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(property));
    }

    @PostMapping
    @PreAuthorize("hasRole('PROPERTY_ADMIN')")
    public ResponseEntity<ApiResponse<Property>> createProperty(
            @Valid @RequestBody PropertyCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Property property = propertyService.createProperty(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(property, "Property created successfully"));
    }
}
