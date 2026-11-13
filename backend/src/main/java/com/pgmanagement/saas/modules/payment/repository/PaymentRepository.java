package com.pgmanagement.saas.modules.payment.repository;

import com.pgmanagement.saas.modules.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<Payment> findAllByResidentIdOrderByCreatedAtDesc(UUID residentId);

    Optional<Payment> findByIdAndOwnerId(UUID id, UUID ownerId);

    Optional<Payment> findByIdAndResidentId(UUID id, UUID residentId);

    Optional<Payment> findByIdempotencyKeyAndOwnerId(String idempotencyKey, UUID ownerId);
}
