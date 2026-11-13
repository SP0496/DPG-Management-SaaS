package com.pgmanagement.saas.modules.room.controller;

import com.pgmanagement.saas.modules.room.dto.request.BedRequest;
import com.pgmanagement.saas.modules.room.dto.request.RoomRequest;
import com.pgmanagement.saas.modules.room.dto.request.UpdateBedStatusRequest;
import com.pgmanagement.saas.modules.room.dto.response.BedResponse;
import com.pgmanagement.saas.modules.room.dto.response.RoomResponse;
import com.pgmanagement.saas.modules.room.service.RoomService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/rooms")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
@Tag(name = "Rooms & Beds", description = "Owner-scoped room and bed inventory management")
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    @Operation(summary = "Create a room inside an owned property")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(@Valid @RequestBody RoomRequest request) {
        RoomResponse created = roomService.createRoom(TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Room created successfully"));
    }

    @GetMapping
    @Operation(summary = "List active rooms for the authenticated owner (optionally filtered by propertyId)")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> listRooms(
            @RequestParam(required = false) UUID propertyId) {
        List<RoomResponse> rooms = roomService.listRooms(TenantContext.currentUserId(), propertyId);
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }

    @GetMapping("/{roomId}")
    @Operation(summary = "Get room details scoped to the authenticated owner")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoom(@PathVariable UUID roomId) {
        return ResponseEntity.ok(ApiResponse.success(roomService.getRoom(roomId, TenantContext.currentUserId())));
    }

    @PutMapping("/{roomId}")
    @Operation(summary = "Update room details scoped to the authenticated owner")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(
            @PathVariable UUID roomId,
            @Valid @RequestBody RoomRequest request) {
        RoomResponse updated = roomService.updateRoom(roomId, TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Room updated successfully"));
    }

    @PostMapping("/{roomId}/beds")
    @Operation(summary = "Add a bed to an owned room")
    public ResponseEntity<ApiResponse<BedResponse>> addBed(
            @PathVariable UUID roomId,
            @Valid @RequestBody BedRequest request) {
        BedResponse created = roomService.addBed(roomId, TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Bed added successfully"));
    }

    @GetMapping("/{roomId}/beds")
    @Operation(summary = "List beds inside an owned room")
    public ResponseEntity<ApiResponse<List<BedResponse>>> listBeds(@PathVariable UUID roomId) {
        return ResponseEntity.ok(ApiResponse.success(roomService.listBeds(roomId, TenantContext.currentUserId())));
    }

    @PatchMapping("/beds/{bedId}/status")
    @Operation(summary = "Update bed availability/maintenance status")
    public ResponseEntity<ApiResponse<BedResponse>> updateBedStatus(
            @PathVariable UUID bedId,
            @Valid @RequestBody UpdateBedStatusRequest request) {
        BedResponse updated = roomService.updateBedStatus(bedId, TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Bed status updated"));
    }
}
