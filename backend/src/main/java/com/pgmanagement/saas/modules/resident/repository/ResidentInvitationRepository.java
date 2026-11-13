package com.pgmanagement.saas.modules.resident.repository;

import com.pgmanagement.saas.modules.resident.entity.InvitationStatus;
import com.pgmanagement.saas.modules.resident.entity.ResidentInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResidentInvitationRepository extends JpaRepository<ResidentInvitation, UUID> {

    Optional<ResidentInvitation> findByTokenHash(String tokenHash);

    Optional<ResidentInvitation> findByIdAndOwnerId(UUID id, UUID ownerId);

    List<ResidentInvitation> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<ResidentInvitation> findAllByResidentUserIdAndStatus(UUID residentUserId, InvitationStatus status);

    List<ResidentInvitation> findAllByPhoneAndStatus(String phone, InvitationStatus status);

    long countByOwnerIdAndStatus(UUID ownerId, InvitationStatus status);
}
