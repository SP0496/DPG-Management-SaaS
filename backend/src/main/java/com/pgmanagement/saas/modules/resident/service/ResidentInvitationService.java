package com.pgmanagement.saas.modules.resident.service;

import com.pgmanagement.saas.modules.property.entity.Property;
import com.pgmanagement.saas.modules.property.service.PropertyService;
import com.pgmanagement.saas.modules.resident.dto.request.CreateInvitationRequest;
import com.pgmanagement.saas.modules.resident.dto.response.ResidentInvitationResponse;
import com.pgmanagement.saas.modules.resident.entity.InvitationStatus;
import com.pgmanagement.saas.modules.resident.entity.ResidentInvitation;
import com.pgmanagement.saas.modules.resident.entity.ResidentProfile;
import com.pgmanagement.saas.modules.resident.repository.ResidentInvitationRepository;
import com.pgmanagement.saas.modules.resident.repository.ResidentProfileRepository;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.modules.users.entity.User;
import com.pgmanagement.saas.modules.users.repository.UserRepository;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.exception.BadRequestException;
import com.pgmanagement.saas.shared.exception.ConflictException;
import com.pgmanagement.saas.shared.exception.ForbiddenException;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResidentInvitationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int DEFAULT_EXPIRY_HOURS = 72;

    private final ResidentInvitationRepository invitationRepository;
    private final ResidentProfileRepository residentProfileRepository;
    private final UserRepository userRepository;
    private final PropertyService propertyService;

    @Transactional
    public ResidentInvitationResponse createInvitation(
            UUID ownerId,
            UUID residentProfileId,
            CreateInvitationRequest request) {
        ResidentProfile profile = residentProfileRepository.findByIdAndOwnerId(residentProfileId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found for this owner"));

        User residentUser = userRepository.findById(profile.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Resident user account not found"));

        if (residentUser.getPhone() == null || residentUser.getPhone().isBlank()) {
            throw new BadRequestException("Resident must have a verified +91 mobile number before inviting");
        }

        UUID propertyId = request != null ? request.getPropertyId() : null;
        String propertyName = null;
        if (propertyId != null) {
            propertyService.assertActivePropertyOwnedBy(propertyId, ownerId);
            Property property = propertyService.findEntityForRead(propertyId);
            propertyName = property.getName();
        }

        List<ResidentInvitation> existingPending = invitationRepository
                .findAllByResidentUserIdAndStatus(residentUser.getId(), InvitationStatus.PENDING);
        for (ResidentInvitation prev : existingPending) {
            prev.setStatus(InvitationStatus.REVOKED);
        }
        if (!existingPending.isEmpty()) {
            invitationRepository.saveAll(existingPending);
        }

        int expiryHours = (request != null && request.getExpiresInHours() != null)
                ? request.getExpiresInHours()
                : DEFAULT_EXPIRY_HOURS;
        String rawInviteCode = generateSecureInviteCode();

        ResidentInvitation saved = invitationRepository.save(ResidentInvitation.builder()
                .ownerId(ownerId)
                .propertyId(propertyId)
                .residentUserId(residentUser.getId())
                .phone(residentUser.getPhone())
                .tokenHash(sha256Hex(rawInviteCode))
                .status(InvitationStatus.PENDING)
                .expiresAt(Instant.now().plus(expiryHours, ChronoUnit.HOURS))
                .build());

        return toResponse(saved, residentUser.getFullName(), propertyName, rawInviteCode);
    }

    @Transactional(readOnly = true)
    public List<ResidentInvitationResponse> listInvitationsForOwner(UUID ownerId) {
        return invitationRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(inv -> mapWithMetadata(inv))
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<ResidentInvitationResponse> searchInvitationsForOwner(
            UUID ownerId, InvitationStatus status, String search, int page, int size) {
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<ResidentInvitationResponse> filtered = invitationRepository
                .findAllByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(this::mapWithMetadata)
                .filter(inv -> status == null || inv.getStatus() == status)
                .filter(inv -> normalizedSearch.isEmpty()
                        || (inv.getResidentName() != null
                                && inv.getResidentName().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                        || inv.getPhone().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                        || (inv.getPropertyName() != null
                                && inv.getPropertyName().toLowerCase(Locale.ROOT).contains(normalizedSearch)))
                .toList();
        return PagedResponse.ofList(filtered, page, size);
    }

    @Transactional
    public ResidentInvitationResponse revokeInvitation(UUID ownerId, UUID invitationId) {
        ResidentInvitation invitation = invitationRepository.findByIdAndOwnerId(invitationId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found for this owner"));
        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new ConflictException("Accepted invitation cannot be revoked");
        }
        invitation.setStatus(InvitationStatus.REVOKED);
        return mapWithMetadata(invitationRepository.save(invitation));
    }

    @Transactional
    public ResidentInvitationResponse acceptInvitationAsResident(UUID residentUserId, String rawInviteCode) {
        User user = userRepository.findById(residentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident account not found"));
        ResidentInvitation accepted = verifyAndAcceptCode(user, rawInviteCode);
        return mapWithMetadata(accepted);
    }

    @Transactional
    public void verifyOrAutoAcceptOnLogin(User user, String optionalInviteCode) {
        if (user.getRole() != Role.RESIDENT) {
            return;
        }
        if (optionalInviteCode != null && !optionalInviteCode.isBlank()) {
            verifyAndAcceptCode(user, optionalInviteCode);
        }
        Instant now = Instant.now();
        List<ResidentInvitation> pending = invitationRepository
                .findAllByPhoneAndStatus(user.getPhone(), InvitationStatus.PENDING);
        for (ResidentInvitation inv : pending) {
            if (inv.getExpiresAt().isBefore(now)) {
                inv.setStatus(InvitationStatus.EXPIRED);
            } else {
                inv.setResidentUserId(user.getId());
                inv.setStatus(InvitationStatus.ACCEPTED);
                inv.setAcceptedAt(now);
                attachResidentProfileToOwnerIfUnassigned(user.getId(), inv.getOwnerId());
            }
        }
        if (!pending.isEmpty()) {
            invitationRepository.saveAll(pending);
        }
    }

    private ResidentInvitation verifyAndAcceptCode(User user, String rawInviteCode) {
        if (user.getRole() != Role.RESIDENT) {
            throw new ForbiddenException("Only resident accounts can claim resident invitations");
        }
        ResidentInvitation invitation = invitationRepository.findByTokenHash(sha256Hex(rawInviteCode.trim()))
                .orElseThrow(() -> new BadRequestException("Invalid invitation code"));

        if (!invitation.getPhone().equals(user.getPhone())) {
            throw new ForbiddenException("Invitation mobile number does not match the signed-in account");
        }
        if (invitation.getStatus() == InvitationStatus.REVOKED) {
            throw new BadRequestException("This invitation has been revoked by the PG owner");
        }
        if (invitation.getStatus() == InvitationStatus.EXPIRED || invitation.getExpiresAt().isBefore(Instant.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new BadRequestException("This invitation has expired");
        }
        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            return invitation;
        }

        attachResidentProfileToOwnerIfUnassigned(user.getId(), invitation.getOwnerId());
        invitation.setResidentUserId(user.getId());
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(Instant.now());
        return invitationRepository.save(invitation);
    }

    private void attachResidentProfileToOwnerIfUnassigned(UUID residentUserId, UUID ownerId) {
        ResidentProfile profile = residentProfileRepository.findByUserId(residentUserId)
                .orElseGet(() -> ResidentProfile.builder().userId(residentUserId).kycVerified(false).build());
        if (profile.getOwnerId() != null && !profile.getOwnerId().equals(ownerId)) {
            throw new ForbiddenException("Resident account is already assigned to another PG owner");
        }
        profile.setOwnerId(ownerId);
        residentProfileRepository.save(profile);
    }

    private ResidentInvitationResponse mapWithMetadata(ResidentInvitation invitation) {
        InvitationStatus effectiveStatus = (invitation.getStatus() == InvitationStatus.PENDING
                && invitation.getExpiresAt().isBefore(Instant.now()))
                ? InvitationStatus.EXPIRED
                : invitation.getStatus();

        String residentName = userRepository.findById(invitation.getResidentUserId())
                .map(User::getFullName)
                .orElse(null);
        String propertyName = invitation.getPropertyId() != null
                ? propertyService.findEntityForRead(invitation.getPropertyId()).getName()
                : null;

        return ResidentInvitationResponse.builder()
                .id(invitation.getId())
                .ownerId(invitation.getOwnerId())
                .propertyId(invitation.getPropertyId())
                .propertyName(propertyName)
                .residentUserId(invitation.getResidentUserId())
                .residentName(residentName)
                .phone(invitation.getPhone())
                .inviteCode(null)
                .status(effectiveStatus)
                .expiresAt(invitation.getExpiresAt())
                .acceptedAt(invitation.getAcceptedAt())
                .createdAt(invitation.getCreatedAt())
                .build();
    }

    private ResidentInvitationResponse toResponse(
            ResidentInvitation invitation,
            String residentName,
            String propertyName,
            String rawInviteCode) {
        return ResidentInvitationResponse.builder()
                .id(invitation.getId())
                .ownerId(invitation.getOwnerId())
                .propertyId(invitation.getPropertyId())
                .propertyName(propertyName)
                .residentUserId(invitation.getResidentUserId())
                .residentName(residentName)
                .phone(invitation.getPhone())
                .inviteCode(rawInviteCode)
                .status(invitation.getStatus())
                .expiresAt(invitation.getExpiresAt())
                .acceptedAt(invitation.getAcceptedAt())
                .createdAt(invitation.getCreatedAt())
                .build();
    }

    private String generateSecureInviteCode() {
        byte[] bytes = new byte[18];
        SECURE_RANDOM.nextBytes(bytes);
        return "PGI-" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }
}
