package com.pgmanagement.saas.modules.owner.dto.response;

import com.pgmanagement.saas.modules.owner.entity.OnboardingStatus;
import com.pgmanagement.saas.modules.owner.entity.OwnerProfile;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class OwnerProfileResponse {

    private UUID id;
    private UUID userId;
    private String businessName;
    private String gstNumber;
    private String panNumber;
    private String supportPhone;
    private String supportEmail;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    private String upiId;
    private String upiPayeeName;
    private String bankAccountHolder;
    private String bankName;
    private String bankAccountNumber;
    private String bankIfscCode;
    private OnboardingStatus onboardingStatus;
    private Instant createdAt;
    private Instant updatedAt;

    public static OwnerProfileResponse from(OwnerProfile profile) {
        return OwnerProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .businessName(profile.getBusinessName())
                .gstNumber(profile.getGstNumber())
                .panNumber(profile.getPanNumber())
                .supportPhone(profile.getSupportPhone())
                .supportEmail(profile.getSupportEmail())
                .address(profile.getAddress())
                .city(profile.getCity())
                .state(profile.getState())
                .postalCode(profile.getPostalCode())
                .upiId(profile.getUpiId())
                .upiPayeeName(profile.getUpiPayeeName())
                .bankAccountHolder(profile.getBankAccountHolder())
                .bankName(profile.getBankName())
                .bankAccountNumber(profile.getBankAccountNumber())
                .bankIfscCode(profile.getBankIfscCode())
                .onboardingStatus(profile.getOnboardingStatus())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
