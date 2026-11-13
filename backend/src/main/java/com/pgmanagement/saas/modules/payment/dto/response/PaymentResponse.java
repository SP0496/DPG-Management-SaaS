package com.pgmanagement.saas.modules.payment.dto.response;

import com.pgmanagement.saas.modules.payment.entity.Payment;
import com.pgmanagement.saas.modules.payment.entity.PaymentMethod;
import com.pgmanagement.saas.modules.payment.entity.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class PaymentResponse {

    private UUID id;
    private UUID ownerId;
    private UUID residentId;
    private UUID invoiceId;
    private String idempotencyKey;
    private PaymentMethod paymentMethod;
    private BigDecimal amount;
    private String currency;
    private String referenceNumber;
    private PaymentStatus status;
    private String notes;
    private Instant paidAt;
    private Instant createdAt;

    public static PaymentResponse from(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .ownerId(payment.getOwnerId())
                .residentId(payment.getResidentId())
                .invoiceId(payment.getInvoiceId())
                .idempotencyKey(payment.getIdempotencyKey())
                .paymentMethod(payment.getPaymentMethod())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .referenceNumber(payment.getReferenceNumber())
                .status(payment.getStatus())
                .notes(payment.getNotes())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
