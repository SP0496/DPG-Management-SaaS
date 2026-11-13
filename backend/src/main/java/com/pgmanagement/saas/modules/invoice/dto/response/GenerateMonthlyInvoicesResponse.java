package com.pgmanagement.saas.modules.invoice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class GenerateMonthlyInvoicesResponse {

    private LocalDate billingMonth;
    private int createdCount;
    private int skippedCount;
    private List<InvoiceResponse> generatedInvoices;
}
