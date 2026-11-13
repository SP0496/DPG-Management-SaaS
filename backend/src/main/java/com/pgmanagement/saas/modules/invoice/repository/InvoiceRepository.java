package com.pgmanagement.saas.modules.invoice.repository;

import com.pgmanagement.saas.modules.invoice.entity.InvoiceStatus;
import com.pgmanagement.saas.modules.invoice.entity.RentInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<RentInvoice, UUID> {

    List<RentInvoice> findAllByOwnerIdOrderByDueDateDesc(UUID ownerId);

    List<RentInvoice> findAllByResidentIdOrderByDueDateDesc(UUID residentId);

    Optional<RentInvoice> findByIdAndOwnerId(UUID id, UUID ownerId);

    Optional<RentInvoice> findByIdAndResidentId(UUID id, UUID residentId);

    boolean existsByBookingIdAndBillingMonthAndStatusNot(
            UUID bookingId, LocalDate billingMonth, InvoiceStatus excludedStatus);
}
