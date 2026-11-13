package com.pgmanagement.saas.modules.payment.repository;

import com.pgmanagement.saas.modules.payment.entity.PaymentConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentConfirmationRepository extends JpaRepository<PaymentConfirmation, UUID> {

    Optional<PaymentConfirmation> findBySubmissionId(UUID submissionId);

    Optional<PaymentConfirmation> findByPaymentId(UUID paymentId);

    List<PaymentConfirmation> findAllBySubmissionIdIn(List<UUID> submissionIds);
}
