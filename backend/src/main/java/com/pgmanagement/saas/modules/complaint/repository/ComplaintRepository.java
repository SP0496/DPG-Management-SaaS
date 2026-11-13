package com.pgmanagement.saas.modules.complaint.repository;

import com.pgmanagement.saas.modules.complaint.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {

    List<Complaint> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<Complaint> findAllByResidentIdOrderByCreatedAtDesc(UUID residentId);

    Optional<Complaint> findByIdAndOwnerId(UUID id, UUID ownerId);

    Optional<Complaint> findByIdAndResidentId(UUID id, UUID residentId);
}
