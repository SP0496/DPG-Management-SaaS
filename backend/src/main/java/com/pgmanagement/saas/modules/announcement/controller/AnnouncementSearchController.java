package com.pgmanagement.saas.modules.announcement.controller;

import com.pgmanagement.saas.modules.announcement.dto.response.AnnouncementResponse;
import com.pgmanagement.saas.modules.announcement.service.AnnouncementService;
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
@RequestMapping("/announcements")
@RequiredArgsConstructor
@Tag(name = "Announcements", description = "Paginated announcement search endpoints")
public class AnnouncementSearchController {

    private final AnnouncementService announcementService;

    @GetMapping("/search")
    @Operation(summary = "Search and paginate active announcements scoped to owner or resident property")
    public ResponseEntity<ApiResponse<PagedResponse<AnnouncementResponse>>> searchAnnouncements(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<AnnouncementResponse> result = announcementService.searchAnnouncements(
                TenantContext.currentUserId(),
                TenantContext.currentRole(),
                propertyId,
                search,
                page,
                size
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
