package com.pgmanagement.saas.modules.room.dto.request;

import com.pgmanagement.saas.modules.room.entity.SharingType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class RoomRequest {

    @NotNull(message = "Property ID is required")
    private UUID propertyId;

    @NotBlank(message = "Room number is required")
    @Size(max = 50, message = "Room number cannot exceed 50 characters")
    private String roomNumber;

    private int floorNumber = 0;

    @NotNull(message = "Sharing type is required")
    private SharingType sharingType;

    @NotNull(message = "Base monthly rent is required")
    @DecimalMin(value = "0.01", message = "Base monthly rent must be positive")
    private BigDecimal baseMonthlyRent;

    private boolean hasAttachedBathroom = false;

    private boolean hasBalcony = false;
}
