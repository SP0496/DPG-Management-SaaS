package com.pgmanagement.saas.repository;

import com.pgmanagement.saas.entity.TenantStay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantStayRepository extends JpaRepository<TenantStay, UUID> {
    List<TenantStay> findByOrganizationIdAndStayStatus(UUID organizationId, String stayStatus);
    Optional<TenantStay> findByUserIdAndStayStatus(UUID userId, String stayStatus);
    Optional<TenantStay> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
