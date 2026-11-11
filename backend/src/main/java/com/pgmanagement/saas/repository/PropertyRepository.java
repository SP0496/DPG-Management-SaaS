package com.pgmanagement.saas.repository;

import com.pgmanagement.saas.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID> {

    // Logical multi-tenancy scoping: IDOR protection
    List<Property> findByOrganizationIdAndActiveTrue(UUID organizationId);

    Optional<Property> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByIdAndOrganizationId(UUID id, UUID organizationId);
}
