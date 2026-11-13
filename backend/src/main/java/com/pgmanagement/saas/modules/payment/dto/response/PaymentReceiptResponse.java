package com.pgmanagement.saas.modules.payment.dto.response;

import com.pgmanagement.saas.modules.payment.entity.PaymentMethod;
import com.pgmanagement.saas.modules.payment.entity.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class PaymentReceiptResponse {

    private String receiptNumber;
    private UUID paymentId;
    private UUID invoiceId;
    private String invoiceNumber;
    private LocalDate billingMonth;
    private String propertyName;
    private String propertyAddress;
    private String roomNumber;
    private String bedNumber;
    private String ownerBusinessName;
    private String ownerPhone;
    private String residentName;
    private String residentPhone;
    private PaymentMethod paymentMethod;
    private BigDecimal amount;
    private String currency;
    private String referenceNumber;
    private PaymentStatus status;
    private String notes;
    private Instant paidAt;
}
