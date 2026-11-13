package com.pgmanagement.saas.modules.room.dto.response;

import com.pgmanagement.saas.modules.room.entity.Bed;
import com.pgmanagement.saas.modules.room.entity.BedStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class BedResponse {

    private UUID id;
    private UUID ownerId;
    private UUID propertyId;
    private UUID roomId;
    private String bedCode;
    private BedStatus status;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;

    public static BedResponse from(Bed bed) {
        return BedResponse.builder()
                .id(bed.getId())
                .ownerId(bed.getOwnerId())
                .propertyId(bed.getPropertyId())
                .roomId(bed.getRoomId())
                .bedCode(bed.getBedCode())
                .status(bed.getStatus())
                .version(bed.getVersion())
                .createdAt(bed.getCreatedAt())
                .updatedAt(bed.getUpdatedAt())
                .build();
    }
}
