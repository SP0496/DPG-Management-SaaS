package com.pgmanagement.saas.modules.resident.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateInvitationRequest {

    private UUID propertyId;

    @Min(value = 1, message = "Expiry hours must be at least 1")
    @Max(value = 720, message = "Expiry hours cannot exceed 720 (30 days)")
    private Integer expiresInHours = 72;
}
