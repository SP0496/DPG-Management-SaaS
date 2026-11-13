package com.pgmanagement.saas.modules.payment.dto.response;

import com.pgmanagement.saas.modules.payment.entity.PaymentMethod;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class RentLedgerEntryResponse {

    private UUID id;
    private UUID submissionId;
    private UUID paymentId;
    private UUID invoiceId;
    private UUID propertyId;
    private String propertyName;
    private int floorNumber;
    private String roomNumber;
    private UUID residentId;
    private String residentName;
    private String invoiceNumber;
    private LocalDate billingMonth;
    private BigDecimal amount;
    private long amountPaise;
    private PaymentMethod paymentMethod;
    private String referenceNumber;
    private LocalDate paymentDate;
    private String status;
    private String receiptNumber;
}
