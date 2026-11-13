package com.pgmanagement.saas.modules.room.dto.response;

import com.pgmanagement.saas.modules.room.entity.Bed;
import com.pgmanagement.saas.modules.room.entity.BedStatus;
import com.pgmanagement.saas.modules.room.entity.Room;
import com.pgmanagement.saas.modules.room.entity.SharingType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class RoomResponse {

    private UUID id;
    private UUID ownerId;
    private UUID propertyId;
    private String roomNumber;
    private int floorNumber;
    private SharingType sharingType;
    private BigDecimal baseMonthlyRent;
    private boolean hasAttachedBathroom;
    private boolean hasBalcony;
    private boolean active;
    private int totalBeds;
    private int occupiedBeds;
    private int vacantBeds;
    private int maintenanceBeds;
    private double occupancyPercentage;
    private List<BedResponse> beds;
    private Instant createdAt;
    private Instant updatedAt;

    public static RoomResponse from(Room room) {
        return from(room, Collections.emptyList());
    }

    public static RoomResponse from(Room room, List<Bed> roomBeds) {
        List<Bed> safeBeds = roomBeds != null ? roomBeds : Collections.emptyList();
        int total = safeBeds.size();
        int occupied = (int) safeBeds.stream().filter(b -> b.getStatus() == BedStatus.OCCUPIED).count();
        int vacant = (int) safeBeds.stream().filter(b -> b.getStatus() == BedStatus.VACANT).count();
        int maintenance = (int) safeBeds.stream()
                .filter(b -> b.getStatus() == BedStatus.MAINTENANCE || b.getStatus() == BedStatus.RESERVED)
                .count();
        double occupancyPct = total == 0 ? 0.0 : Math.round((occupied * 1000.0) / total) / 10.0;

        return RoomResponse.builder()
                .id(room.getId())
                .ownerId(room.getOwnerId())
                .propertyId(room.getPropertyId())
                .roomNumber(room.getRoomNumber())
                .floorNumber(room.getFloorNumber())
                .sharingType(room.getSharingType())
                .baseMonthlyRent(room.getBaseMonthlyRent())
                .hasAttachedBathroom(room.isHasAttachedBathroom())
                .hasBalcony(room.isHasBalcony())
                .active(room.isActive())
                .totalBeds(total)
                .occupiedBeds(occupied)
                .vacantBeds(vacant)
                .maintenanceBeds(maintenance)
                .occupancyPercentage(occupancyPct)
                .beds(safeBeds.stream().map(BedResponse::from).toList())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }
}
