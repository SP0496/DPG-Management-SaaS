package com.pgmanagement.saas.modules.resident.dto.response;

import com.pgmanagement.saas.modules.resident.entity.ResidentProfile;
import com.pgmanagement.saas.modules.users.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ResidentProfileResponse {

    private UUID id;
    private UUID userId;
    private UUID ownerId;
    private String fullName;
    private String email;
    private String phone;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String permanentAddress;
    private String idProofType;
    private String idProofLast4;
    private String occupation;
    private boolean kycVerified;
    private Instant createdAt;
    private Instant updatedAt;

    public static ResidentProfileResponse from(ResidentProfile profile, User user) {
        return ResidentProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .ownerId(profile.getOwnerId())
                .fullName(user != null ? user.getFullName() : null)
                .email(user != null ? user.getEmail() : null)
                .phone(user != null ? user.getPhone() : null)
                .emergencyContactName(profile.getEmergencyContactName())
                .emergencyContactPhone(profile.getEmergencyContactPhone())
                .permanentAddress(profile.getPermanentAddress())
                .idProofType(profile.getIdProofType())
                .idProofLast4(profile.getIdProofLast4())
                .occupation(profile.getOccupation())
                .kycVerified(profile.isKycVerified())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
