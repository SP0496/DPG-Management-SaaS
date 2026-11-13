package com.pgmanagement.saas.modules.complaint.controller;

import com.pgmanagement.saas.modules.complaint.dto.request.CreateComplaintRequest;
import com.pgmanagement.saas.modules.complaint.dto.request.UpdateComplaintStatusRequest;
import com.pgmanagement.saas.modules.complaint.dto.response.ComplaintResponse;
import com.pgmanagement.saas.modules.complaint.service.ComplaintService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints", description = "Resident maintenance complaint submission and owner resolution workflow")
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    @PreAuthorize("hasRole('RESIDENT')")
    @Operation(summary = "Submit a maintenance complaint for the resident's assigned PG property")
    public ResponseEntity<ApiResponse<ComplaintResponse>> submitComplaint(
            @Valid @RequestBody CreateComplaintRequest request) {
        ComplaintResponse created = complaintService.submitComplaint(TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Complaint submitted successfully"));
    }

    @GetMapping
    @Operation(summary = "List complaints scoped to authenticated owner or resident")
    public ResponseEntity<ApiResponse<List<ComplaintResponse>>> listComplaints() {
        List<ComplaintResponse> list = complaintService.listComplaints(
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{complaintId}")
    @Operation(summary = "Get complaint details scoped to owner or resident")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(@PathVariable UUID complaintId) {
        ComplaintResponse response = complaintService.getComplaint(
                complaintId,
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{complaintId}/status")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Update complaint status and resolution notes")
    public ResponseEntity<ApiResponse<ComplaintResponse>> updateStatus(
            @PathVariable UUID complaintId,
            @Valid @RequestBody UpdateComplaintStatusRequest request) {
        ComplaintResponse updated = complaintService.updateStatus(complaintId, TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Complaint status updated"));
    }
}
