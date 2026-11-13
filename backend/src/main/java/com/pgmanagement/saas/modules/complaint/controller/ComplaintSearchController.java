package com.pgmanagement.saas.modules.complaint.controller;

import com.pgmanagement.saas.modules.complaint.dto.response.ComplaintResponse;
import com.pgmanagement.saas.modules.complaint.entity.ComplaintPriority;
import com.pgmanagement.saas.modules.complaint.entity.ComplaintStatus;
import com.pgmanagement.saas.modules.complaint.service.ComplaintService;
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

import java.util.UUID;

@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints", description = "Paginated complaint search endpoints")
public class ComplaintSearchController {

    private final ComplaintService complaintService;

    @GetMapping("/search")
    @Operation(summary = "Search and paginate complaints scoped to owner or resident")
    public ResponseEntity<ApiResponse<PagedResponse<ComplaintResponse>>> searchComplaints(
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) ComplaintPriority priority,
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<ComplaintResponse> result = complaintService.searchComplaints(
                TenantContext.currentUserId(),
                TenantContext.currentRole(),
                status,
                priority,
                propertyId,
                search,
                page,
                size
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
