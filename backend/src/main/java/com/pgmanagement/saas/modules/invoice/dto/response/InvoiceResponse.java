package com.pgmanagement.saas.modules.invoice.dto.response;

import com.pgmanagement.saas.modules.invoice.entity.InvoiceStatus;
import com.pgmanagement.saas.modules.invoice.entity.RentInvoice;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class InvoiceResponse {

    private UUID id;
    private UUID ownerId;
    private UUID propertyId;
    private UUID residentId;
    private UUID bookingId;
    private String invoiceNumber;
    private LocalDate billingMonth;
    private LocalDate billingPeriodStart;
    private LocalDate billingPeriodEnd;
    private BigDecimal baseRent;
    private BigDecimal utilityCharges;
    private BigDecimal penaltyFee;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceDue;
    private long baseRentPaise;
    private long additionalChargesPaise;
    private long penaltyFeePaise;
    private long totalAmountPaise;
    private long paidAmountPaise;
    private long balanceDuePaise;
    @Builder.Default
    private List<InvoiceItemResponse> items = Collections.emptyList();
    private String currency;
    private InvoiceStatus status;
    private LocalDate dueDate;
    private Instant paidAt;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public static InvoiceResponse from(RentInvoice invoice) {
        return from(invoice, Collections.emptyList());
    }

    public static InvoiceResponse from(RentInvoice invoice, List<InvoiceItemResponse> items) {
        long basePaise = invoice.getBaseRentPaise() > 0 || invoice.getBaseRent() == null
                ? invoice.getBaseRentPaise()
                : invoice.getBaseRent().movePointRight(2).longValue();
        long addPaise = invoice.getAdditionalChargesPaise();
        long penPaise = invoice.getPenaltyFeePaise();
        long totPaise = invoice.getTotalAmountPaise() > 0 || invoice.getTotalAmount() == null
                ? invoice.getTotalAmountPaise()
                : invoice.getTotalAmount().movePointRight(2).longValue();
        long pdPaise = invoice.getPaidAmountPaise();
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .ownerId(invoice.getOwnerId())
                .propertyId(invoice.getPropertyId())
                .residentId(invoice.getResidentId())
                .bookingId(invoice.getBookingId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .billingMonth(invoice.getBillingMonth())
                .billingPeriodStart(invoice.getBillingPeriodStart())
                .billingPeriodEnd(invoice.getBillingPeriodEnd())
                .baseRent(invoice.getBaseRent())
                .utilityCharges(invoice.getUtilityCharges())
                .penaltyFee(invoice.getPenaltyFee())
                .totalAmount(invoice.getTotalAmount())
                .paidAmount(invoice.getPaidAmount())
                .balanceDue(invoice.getTotalAmount().subtract(invoice.getPaidAmount()))
                .baseRentPaise(basePaise)
                .additionalChargesPaise(addPaise)
                .penaltyFeePaise(penPaise)
                .totalAmountPaise(totPaise)
                .paidAmountPaise(pdPaise)
                .balanceDuePaise(Math.max(0L, totPaise - pdPaise))
                .items(items != null ? items : Collections.emptyList())
                .currency(invoice.getCurrency())
                .status(invoice.getStatus())
                .dueDate(invoice.getDueDate())
                .paidAt(invoice.getPaidAt())
                .notes(invoice.getNotes())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }
}
