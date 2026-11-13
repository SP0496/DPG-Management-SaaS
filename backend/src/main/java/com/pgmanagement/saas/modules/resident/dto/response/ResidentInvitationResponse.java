package com.pgmanagement.saas.modules.resident.dto.response;

import com.pgmanagement.saas.modules.resident.entity.InvitationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ResidentInvitationResponse {

    private UUID id;
    private UUID ownerId;
    private UUID propertyId;
    private String propertyName;
    private UUID residentUserId;
    private String residentName;
    private String phone;
    private String inviteCode;
    private InvitationStatus status;
    private Instant expiresAt;
    private Instant acceptedAt;
    private Instant createdAt;
}
