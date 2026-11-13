package com.pgmanagement.saas.modules.resident.repository;

import com.pgmanagement.saas.modules.resident.entity.ResidentProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResidentProfileRepository extends JpaRepository<ResidentProfile, UUID> {

    Optional<ResidentProfile> findByUserId(UUID userId);

    Optional<ResidentProfile> findByIdAndOwnerId(UUID id, UUID ownerId);

    List<ResidentProfile> findAllByOwnerId(UUID ownerId);

    boolean existsByUserId(UUID userId);
}
