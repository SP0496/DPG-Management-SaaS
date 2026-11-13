package com.pgmanagement.saas.modules.property.repository;

import com.pgmanagement.saas.modules.property.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyRepository extends JpaRepository<Property, UUID> {

    List<Property> findAllByOwnerIdAndActiveTrue(UUID ownerId);

    Optional<Property> findByIdAndOwnerId(UUID id, UUID ownerId);

    boolean existsByIdAndOwnerIdAndActiveTrue(UUID id, UUID ownerId);
}
