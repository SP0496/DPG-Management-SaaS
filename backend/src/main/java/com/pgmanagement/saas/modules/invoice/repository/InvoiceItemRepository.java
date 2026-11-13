package com.pgmanagement.saas.modules.invoice.repository;

import com.pgmanagement.saas.modules.invoice.entity.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, UUID> {

    List<InvoiceItem> findAllByInvoiceIdOrderByCreatedAtAsc(UUID invoiceId);

    List<InvoiceItem> findAllByInvoiceIdInOrderByCreatedAtAsc(List<UUID> invoiceIds);
}
