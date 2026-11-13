package com.pgmanagement.saas.modules.invoice.dto.response;

import com.pgmanagement.saas.modules.invoice.entity.InvoiceItem;
import com.pgmanagement.saas.modules.invoice.entity.InvoiceItemType;
import com.pgmanagement.saas.shared.util.MoneyUtils;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class InvoiceItemResponse {

    private UUID id;
    private InvoiceItemType itemType;
    private String description;
    private long amountPaise;
    private BigDecimal amount;

    public static InvoiceItemResponse from(InvoiceItem item) {
        return InvoiceItemResponse.builder()
                .id(item.getId())
                .itemType(item.getItemType())
                .description(item.getDescription())
                .amountPaise(item.getAmountPaise())
                .amount(MoneyUtils.toRupees(item.getAmountPaise()))
                .build();
    }
}
