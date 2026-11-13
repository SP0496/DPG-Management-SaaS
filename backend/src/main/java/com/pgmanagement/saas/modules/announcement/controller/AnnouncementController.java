package com.pgmanagement.saas.modules.announcement.controller;

import com.pgmanagement.saas.modules.announcement.dto.request.CreateAnnouncementRequest;
import com.pgmanagement.saas.modules.announcement.dto.response.AnnouncementResponse;
import com.pgmanagement.saas.modules.announcement.service.AnnouncementService;
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
@RequestMapping("/announcements")
@RequiredArgsConstructor
@Tag(name = "Announcements", description = "Owner broadcast notices scoped to properties and residents")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Publish an announcement across all owner properties or a specific property")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(
            @Valid @RequestBody CreateAnnouncementRequest request) {
        AnnouncementResponse created = announcementService.createAnnouncement(TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Announcement published successfully"));
    }

    @GetMapping
    @Operation(summary = "List active announcements visible to the authenticated owner or resident")
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> listAnnouncements() {
        List<AnnouncementResponse> list = announcementService.listAnnouncements(
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PatchMapping("/{announcementId}/deactivate")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Deactivate an announcement owned by the authenticated owner")
    public ResponseEntity<ApiResponse<Void>> deactivateAnnouncement(@PathVariable UUID announcementId) {
        announcementService.deactivateAnnouncement(announcementId, TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.ok("Announcement deactivated"));
    }
}
