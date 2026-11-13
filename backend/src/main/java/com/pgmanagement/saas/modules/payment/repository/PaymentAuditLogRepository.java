package com.pgmanagement.saas.modules.payment.repository;

import com.pgmanagement.saas.modules.payment.entity.PaymentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentAuditLogRepository extends JpaRepository<PaymentAuditLog, UUID> {

    List<PaymentAuditLog> findAllBySubmissionIdOrderByCreatedAtAsc(UUID submissionId);
}
