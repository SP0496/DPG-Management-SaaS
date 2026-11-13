package com.pgmanagement.saas.modules.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_confirmations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentConfirmation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "submission_id", nullable = false, unique = true)
    private UUID submissionId;

    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "resident_id", nullable = false)
    private UUID residentId;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentSubmissionStatus decision;

    @Column(name = "verified_by_owner_id", nullable = false)
    private UUID verifiedByOwnerId;

    @Builder.Default
    @Column(name = "verification_source", nullable = false, length = 60)
    private String verificationSource = "OWNER_MANUAL_RECONCILIATION";

    @Column(name = "receipt_number", unique = true, length = 60)
    private String receiptNumber;

    @Column(name = "confirmed_amount_paise", nullable = false)
    private long confirmedAmountPaise;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "decided_at", nullable = false)
    private Instant decidedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
