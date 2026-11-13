package com.pgmanagement.saas.modules.owner.service;

import com.pgmanagement.saas.modules.owner.dto.request.UpsertOwnerProfileRequest;
import com.pgmanagement.saas.modules.owner.dto.response.OwnerProfileResponse;
import com.pgmanagement.saas.modules.owner.entity.OnboardingStatus;
import com.pgmanagement.saas.modules.owner.entity.OwnerProfile;
import com.pgmanagement.saas.modules.owner.repository.OwnerProfileRepository;
import com.pgmanagement.saas.modules.users.entity.User;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OwnerService {

    private final OwnerProfileRepository ownerProfileRepository;

    @Transactional
    public void initializeProfileForOwner(User ownerUser, String businessName) {
        if (ownerProfileRepository.existsByUserId(ownerUser.getId())) {
            return;
        }
        String resolvedName = (businessName != null && !businessName.isBlank())
                ? businessName.trim()
                : ownerUser.getFullName() + " PG";

        OwnerProfile profile = OwnerProfile.builder()
                .userId(ownerUser.getId())
                .businessName(resolvedName)
                .supportPhone(ownerUser.getPhone())
                .supportEmail(ownerUser.getEmail())
                .onboardingStatus(OnboardingStatus.NOT_STARTED)
                .build();
        ownerProfileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public OwnerProfileResponse getMyProfile(UUID ownerUserId) {
        OwnerProfile profile = ownerProfileRepository.findByUserId(ownerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner profile not found"));
        return OwnerProfileResponse.from(profile);
    }

    @Transactional
    public OwnerProfileResponse updateMyProfile(UUID ownerUserId, UpsertOwnerProfileRequest request) {
        OwnerProfile profile = ownerProfileRepository.findByUserId(ownerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner profile not found"));

        profile.setBusinessName(request.getBusinessName().trim());
        profile.setGstNumber(trimOrNull(request.getGstNumber()));
        profile.setPanNumber(trimOrNull(request.getPanNumber()));
        profile.setSupportPhone(trimOrNull(request.getSupportPhone()));
        profile.setSupportEmail(trimOrNull(request.getSupportEmail()));
        profile.setAddress(trimOrNull(request.getAddress()));
        profile.setCity(trimOrNull(request.getCity()));
        profile.setState(trimOrNull(request.getState()));
        profile.setPostalCode(trimOrNull(request.getPostalCode()));
        if (request.getUpiId() != null) {
            profile.setUpiId(trimOrNull(request.getUpiId()));
        }
        if (request.getUpiPayeeName() != null) {
            profile.setUpiPayeeName(trimOrNull(request.getUpiPayeeName()));
        }
        if (request.getBankAccountHolder() != null) {
            profile.setBankAccountHolder(trimOrNull(request.getBankAccountHolder()));
        }
        if (request.getBankName() != null) {
            profile.setBankName(trimOrNull(request.getBankName()));
        }
        if (request.getBankAccountNumber() != null) {
            profile.setBankAccountNumber(trimOrNull(request.getBankAccountNumber()));
        }
        if (request.getBankIfscCode() != null) {
            String trimmedIfsc = trimOrNull(request.getBankIfscCode());
            profile.setBankIfscCode(trimmedIfsc == null ? null : trimmedIfsc.toUpperCase());
        }

        return OwnerProfileResponse.from(ownerProfileRepository.save(profile));
    }

    private String trimOrNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
