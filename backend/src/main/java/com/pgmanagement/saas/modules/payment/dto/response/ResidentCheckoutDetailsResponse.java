package com.pgmanagement.saas.modules.payment.dto.response;

import com.pgmanagement.saas.modules.invoice.dto.response.InvoiceItemResponse;
import com.pgmanagement.saas.modules.invoice.entity.InvoiceStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ResidentCheckoutDetailsResponse {

    private UUID invoiceId;
    private String invoiceNumber;
    private LocalDate billingMonth;
    private LocalDate dueDate;
    private InvoiceStatus status;

    private long fixedMonthlyRentPaise;
    private long additionalChargesPaise;
    private long penaltyFeePaise;
    private long totalAmountPaise;
    private long paidAmountPaise;
    private long outstandingAmountPaise;

    private BigDecimal fixedMonthlyRent;
    private BigDecimal additionalCharges;
    private BigDecimal penaltyFee;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal outstandingAmount;
    private List<InvoiceItemResponse> items;

    private String propertyName;
    private int floorNumber;
    private String roomNumber;
    private String bedCode;
    private String residentName;

    private String ownerBusinessName;
    private String ownerUpiId;
    private String ownerUpiPayeeName;
    private String upiDeepLink;
    private String bankAccountHolder;
    private String bankName;
    private String bankAccountNumber;
    private String bankIfscCode;

    private boolean bankVerificationAvailable;
    private String verificationNotice;
}
