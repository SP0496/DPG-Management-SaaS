package com.pgmanagement.saas.modules.invoice.entity;

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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "rent_invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentInvoice extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "resident_id", nullable = false)
    private UUID residentId;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 60)
    private String invoiceNumber;

    @Column(name = "billing_month", nullable = false)
    private LocalDate billingMonth;

    @Column(name = "base_rent", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseRent;

    @Builder.Default
    @Column(name = "utility_charges", nullable = false, precision = 12, scale = 2)
    private BigDecimal utilityCharges = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "penalty_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal penaltyFee = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(name = "paid_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InvoiceStatus status = InvoiceStatus.ISSUED;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "assignment_id")
    private UUID assignmentId;

    @Column(name = "billing_period_start")
    private LocalDate billingPeriodStart;

    @Column(name = "billing_period_end")
    private LocalDate billingPeriodEnd;

    @Builder.Default
    @Column(name = "base_rent_paise", nullable = false)
    private long baseRentPaise = 0L;

    @Builder.Default
    @Column(name = "additional_charges_paise", nullable = false)
    private long additionalChargesPaise = 0L;

    @Builder.Default
    @Column(name = "penalty_fee_paise", nullable = false)
    private long penaltyFeePaise = 0L;

    @Builder.Default
    @Column(name = "total_amount_paise", nullable = false)
    private long totalAmountPaise = 0L;

    @Builder.Default
    @Column(name = "paid_amount_paise", nullable = false)
    private long paidAmountPaise = 0L;
}
