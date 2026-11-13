package com.pgmanagement.saas.modules.payment.entity;

import com.pgmanagement.saas.shared.entity.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "payment_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSubmission extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Builder.Default
    @Column(name = "floor_number", nullable = false)
    private int floorNumber = 0;

    @Column(name = "room_number", length = 50)
    private String roomNumber;

    @Column(name = "resident_id", nullable = false)
    private UUID residentId;

    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 120)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Column(name = "amount_paise", nullable = false)
    private long amountPaise;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Column(name = "utr_reference", nullable = false, length = 120)
    private String utrReference;

    @Column(name = "normalized_utr", nullable = false, length = 120)
    private String normalizedUtr;

    @Column(name = "payer_upi_id", length = 120)
    private String payerUpiId;

    @Column(name = "payer_name", length = 150)
    private String payerName;

    @Column(name = "bank_name", length = 120)
    private String bankName;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentSubmissionStatus status = PaymentSubmissionStatus.PENDING_VERIFICATION;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;
}
