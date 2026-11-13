package com.pgmanagement.saas.modules.payment.dto.response;

import com.pgmanagement.saas.modules.payment.entity.PaymentMethod;
import com.pgmanagement.saas.modules.payment.entity.PaymentSubmissionStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class PaymentSubmissionResponse {

    private UUID id;
    private UUID ownerId;
    private UUID propertyId;
    private String propertyName;
    private int floorNumber;
    private String roomNumber;
    private UUID residentId;
    private String residentName;
    private UUID invoiceId;
    private String invoiceNumber;
    private LocalDate billingMonth;
    private String idempotencyKey;
    private PaymentMethod paymentMethod;
    private long amountPaise;
    private BigDecimal amount;
    private String currency;
    private String utrReference;
    private String payerUpiId;
    private String payerName;
    private String bankName;
    private LocalDate paymentDate;
    private String notes;
    private PaymentSubmissionStatus status;
    private String rejectionReason;
    private Instant submittedAt;
    private Instant verifiedAt;
    private String receiptNumber;
    private UUID paymentId;
    private long remainingBalancePaise;
    private BigDecimal remainingBalance;
    private String ownerRemarks;
    private String verificationSource;
}
