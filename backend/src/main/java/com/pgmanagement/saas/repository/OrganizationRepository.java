package com.pgmanagement.saas.repository;

import com.pgmanagement.saas.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    Optional<Organization> findByContactEmail(String contactEmail);
    boolean existsByContactEmail(String contactEmail);
}
