package com.pgmanagement.saas.modules.payment.repository;

import com.pgmanagement.saas.modules.payment.entity.PaymentSubmission;
import com.pgmanagement.saas.modules.payment.entity.PaymentSubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentSubmissionRepository extends JpaRepository<PaymentSubmission, UUID> {

    Optional<PaymentSubmission> findByIdempotencyKey(String idempotencyKey);

    Optional<PaymentSubmission> findByIdAndOwnerId(UUID id, UUID ownerId);

    Optional<PaymentSubmission> findByIdAndResidentId(UUID id, UUID residentId);

    boolean existsByOwnerIdAndNormalizedUtr(UUID ownerId, String normalizedUtr);

    boolean existsByOwnerIdAndNormalizedUtrAndStatusIn(
            UUID ownerId, String normalizedUtr, List<PaymentSubmissionStatus> statuses);

    List<PaymentSubmission> findAllByOwnerIdOrderBySubmittedAtDesc(UUID ownerId);

    List<PaymentSubmission> findAllByResidentIdOrderBySubmittedAtDesc(UUID residentId);

    List<PaymentSubmission> findAllByInvoiceIdOrderBySubmittedAtDesc(UUID invoiceId);

    long countByOwnerIdAndStatus(UUID ownerId, PaymentSubmissionStatus status);
}
