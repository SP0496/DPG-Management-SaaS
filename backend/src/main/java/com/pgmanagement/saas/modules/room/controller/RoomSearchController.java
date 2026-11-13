package com.pgmanagement.saas.modules.room.controller;

import com.pgmanagement.saas.modules.room.dto.response.BedResponse;
import com.pgmanagement.saas.modules.room.dto.response.RoomResponse;
import com.pgmanagement.saas.modules.room.entity.BedStatus;
import com.pgmanagement.saas.modules.room.service.RoomService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/rooms")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
@Tag(name = "Rooms & Beds", description = "Floor-wise room filtering, search, and bed inventory endpoints")
public class RoomSearchController {

    private final RoomService roomService;

    @GetMapping("/search")
    @Operation(summary = "Search and paginate rooms with optional property and floor filters and bed occupancy counts")
    public ResponseEntity<ApiResponse<PagedResponse<RoomResponse>>> searchRooms(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) Integer floorNumber,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<RoomResponse> result = roomService.searchRooms(
                TenantContext.currentUserId(), propertyId, floorNumber, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/beds")
    @Operation(summary = "List beds owned by the authenticated owner with optional property and status filters")
    public ResponseEntity<ApiResponse<List<BedResponse>>> listOwnerBeds(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) BedStatus status) {
        List<BedResponse> result = roomService.listOwnerBeds(TenantContext.currentUserId(), propertyId, status);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/beds/{bedId}")
    @Operation(summary = "Delete an unoccupied bed belonging to the authenticated owner")
    public ResponseEntity<ApiResponse<Void>> deleteBed(@PathVariable UUID bedId) {
        roomService.deleteBed(bedId, TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.ok("Bed removed successfully"));
    }
}
