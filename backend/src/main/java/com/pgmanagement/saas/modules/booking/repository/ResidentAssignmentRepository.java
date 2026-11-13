package com.pgmanagement.saas.modules.booking.repository;

import com.pgmanagement.saas.modules.booking.entity.ResidentAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ResidentAssignmentRepository extends JpaRepository<ResidentAssignment, UUID> {

    Optional<ResidentAssignment> findByBookingId(UUID bookingId);
}
