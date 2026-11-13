package com.pgmanagement.saas.modules.resident.service;

import com.pgmanagement.saas.modules.resident.dto.request.OnboardResidentRequest;
import com.pgmanagement.saas.modules.resident.dto.request.UpsertResidentProfileRequest;
import com.pgmanagement.saas.modules.resident.dto.response.ResidentProfileResponse;
import com.pgmanagement.saas.modules.resident.entity.ResidentProfile;
import com.pgmanagement.saas.modules.resident.repository.ResidentProfileRepository;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.modules.users.entity.User;
import com.pgmanagement.saas.modules.users.repository.UserRepository;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.exception.BadRequestException;
import com.pgmanagement.saas.shared.exception.ConflictException;
import com.pgmanagement.saas.shared.exception.ForbiddenException;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import com.pgmanagement.saas.shared.util.PhoneNumberUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResidentService {

    private final ResidentProfileRepository residentProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public void initializeProfileForResident(User residentUser) {
        if (residentProfileRepository.existsByUserId(residentUser.getId())) {
            return;
        }
        ResidentProfile profile = ResidentProfile.builder()
                .userId(residentUser.getId())
                .kycVerified(false)
                .build();
        residentProfileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public ResidentProfileResponse getMyProfile(UUID residentUserId) {
        ResidentProfile profile = residentProfileRepository.findByUserId(residentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident profile not found"));
        User user = userRepository.findById(residentUserId).orElse(null);
        return ResidentProfileResponse.from(profile, user);
    }

    @Transactional
    public ResidentProfileResponse updateMyProfile(UUID residentUserId, UpsertResidentProfileRequest request) {
        ResidentProfile profile = residentProfileRepository.findByUserId(residentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident profile not found"));

        profile.setEmergencyContactName(trimOrNull(request.getEmergencyContactName()));
        profile.setEmergencyContactPhone(trimOrNull(request.getEmergencyContactPhone()));
        profile.setPermanentAddress(trimOrNull(request.getPermanentAddress()));
        profile.setIdProofType(trimOrNull(request.getIdProofType()));
        profile.setIdProofLast4(trimOrNull(request.getIdProofLast4()));
        profile.setOccupation(trimOrNull(request.getOccupation()));

        ResidentProfile saved = residentProfileRepository.save(profile);
        User user = userRepository.findById(residentUserId).orElse(null);
        return ResidentProfileResponse.from(saved, user);
    }

    @Transactional
    public ResidentProfileResponse onboardResident(UUID ownerId, OnboardResidentRequest request) {
        String normalizedEmail = trimToLowerOrNull(request.getEmail());
        String normalizedPhone = PhoneNumberUtils.normalizeIndianE164(request.getPhone());

        Optional<User> existingByPhone = userRepository.findByPhone(normalizedPhone);
        if (existingByPhone.isPresent()) {
            User existingUser = existingByPhone.get();
            if (existingUser.getRole() != Role.RESIDENT) {
                throw new ConflictException("This phone number belongs to a PG owner account");
            }
            final UUID residentUserId = existingUser.getId();
            ResidentProfile existingProfile = residentProfileRepository.findByUserId(residentUserId)
                    .orElseGet(() -> ResidentProfile.builder().userId(residentUserId).kycVerified(false).build());
            if (existingProfile.getOwnerId() != null) {
                throw new ConflictException("A resident with this phone number is already onboarded");
            }
            existingUser.setFullName(request.getFullName().trim());
            if (existingUser.getEmail() == null && normalizedEmail != null
                    && !userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                existingUser.setEmail(normalizedEmail);
            }
            existingUser = userRepository.save(existingUser);

            existingProfile.setOwnerId(ownerId);
            applyOptionalProfileFields(existingProfile, request);
            ResidentProfile savedProfile = residentProfileRepository.save(existingProfile);
            return ResidentProfileResponse.from(savedProfile, existingUser);
        }

        if (normalizedEmail != null && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("A user with this email already exists");
        }

        User residentUser = User.builder()
                .email(normalizedEmail)
                .phone(normalizedPhone)
                .fullName(request.getFullName().trim())
                .role(Role.RESIDENT)
                .active(true)
                .accountNonLocked(true)
                .build();
        residentUser = userRepository.save(residentUser);

        ResidentProfile profile = ResidentProfile.builder()
                .userId(residentUser.getId())
                .ownerId(ownerId)
                .kycVerified(false)
                .build();
        applyOptionalProfileFields(profile, request);
        profile = residentProfileRepository.save(profile);
        return ResidentProfileResponse.from(profile, residentUser);
    }

    @Transactional(readOnly = true)
    public List<ResidentProfileResponse> listResidentsByOwner(UUID ownerId) {
        return residentProfileRepository.findAllByOwnerId(ownerId)
                .stream()
                .map(profile -> ResidentProfileResponse.from(
                        profile,
                        userRepository.findById(profile.getUserId()).orElse(null)))
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<ResidentProfileResponse> searchResidentsByOwner(
            UUID ownerId, Boolean kycVerified, String search, int page, int size) {
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<ResidentProfileResponse> filtered = residentProfileRepository.findAllByOwnerId(ownerId)
                .stream()
                .map(profile -> ResidentProfileResponse.from(
                        profile,
                        userRepository.findById(profile.getUserId()).orElse(null)))
                .filter(item -> kycVerified == null || item.isKycVerified() == kycVerified)
                .filter(item -> normalizedSearch.isEmpty()
                        || (item.getFullName() != null && item.getFullName().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                        || (item.getPhone() != null && item.getPhone().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                        || (item.getOccupation() != null && item.getOccupation().toLowerCase(Locale.ROOT).contains(normalizedSearch)))
                .sorted(Comparator.comparing(
                        ResidentProfileResponse::getFullName,
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
        return PagedResponse.ofList(filtered, page, size);
    }

    private void applyOptionalProfileFields(ResidentProfile profile, OnboardResidentRequest request) {
        profile.setEmergencyContactName(trimOrNull(request.getEmergencyContactName()));
        profile.setEmergencyContactPhone(trimOrNull(request.getEmergencyContactPhone()));
        profile.setPermanentAddress(trimOrNull(request.getPermanentAddress()));
        profile.setIdProofType(trimOrNull(request.getIdProofType()));
        profile.setIdProofLast4(trimOrNull(request.getIdProofLast4()));
        profile.setOccupation(trimOrNull(request.getOccupation()));
    }

    @Transactional(readOnly = true)
    public ResidentProfileResponse getResidentForOwner(UUID residentProfileId, UUID ownerId) {
        ResidentProfile profile = residentProfileRepository.findByIdAndOwnerId(residentProfileId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found for this owner"));
        User user = userRepository.findById(profile.getUserId()).orElse(null);
        return ResidentProfileResponse.from(profile, user);
    }

    @Transactional
    public ResidentProfileResponse verifyResidentKyc(UUID residentProfileId, UUID ownerId) {
        ResidentProfile profile = residentProfileRepository.findByIdAndOwnerId(residentProfileId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found for this owner"));
        profile.setKycVerified(true);
        ResidentProfile saved = residentProfileRepository.save(profile);
        User user = userRepository.findById(saved.getUserId()).orElse(null);
        return ResidentProfileResponse.from(saved, user);
    }

    @Transactional
    public void validateAndAssignResidentToOwner(UUID residentUserId, UUID ownerId) {
        User user = userRepository.findById(residentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident user account not found"));
        if (user.getRole() != Role.RESIDENT) {
            throw new BadRequestException("Specified user does not have the RESIDENT role");
        }
        ResidentProfile profile = residentProfileRepository.findByUserId(residentUserId)
                .orElseGet(() -> ResidentProfile.builder()
                        .userId(residentUserId)
                        .ownerId(ownerId)
                        .build());

        if (profile.getOwnerId() != null && !profile.getOwnerId().equals(ownerId)) {
            throw new ForbiddenException("Resident belongs to another PG owner tenant");
        }
        profile.setOwnerId(ownerId);
        residentProfileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public Optional<UUID> findOwnerIdForResident(UUID residentUserId) {
        return residentProfileRepository.findByUserId(residentUserId)
                .map(ResidentProfile::getOwnerId);
    }

    private String trimOrNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private String trimToLowerOrNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim().toLowerCase();
    }
}
