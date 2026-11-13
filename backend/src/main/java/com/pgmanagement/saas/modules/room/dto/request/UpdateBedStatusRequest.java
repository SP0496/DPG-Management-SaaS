package com.pgmanagement.saas.modules.room.dto.request;

import com.pgmanagement.saas.modules.room.entity.BedStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateBedStatusRequest {

    @NotNull(message = "Bed status is required")
    private BedStatus status;
}
