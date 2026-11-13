package com.pgmanagement.saas.modules.invoice.service;

import com.pgmanagement.saas.modules.booking.entity.Booking;
import com.pgmanagement.saas.modules.booking.entity.BookingStatus;
import com.pgmanagement.saas.modules.booking.service.BookingService;
import com.pgmanagement.saas.modules.invoice.dto.request.CreateInvoiceRequest;
import com.pgmanagement.saas.modules.invoice.dto.request.GenerateMonthlyInvoicesRequest;
import com.pgmanagement.saas.modules.invoice.dto.response.GenerateMonthlyInvoicesResponse;
import com.pgmanagement.saas.modules.invoice.dto.response.InvoiceItemResponse;
import com.pgmanagement.saas.modules.invoice.dto.response.InvoiceResponse;
import com.pgmanagement.saas.modules.invoice.entity.InvoiceItem;
import com.pgmanagement.saas.modules.invoice.entity.InvoiceItemType;
import com.pgmanagement.saas.modules.invoice.entity.InvoiceStatus;
import com.pgmanagement.saas.modules.invoice.entity.RentInvoice;
import com.pgmanagement.saas.modules.invoice.repository.InvoiceItemRepository;
import com.pgmanagement.saas.modules.invoice.repository.InvoiceRepository;
import com.pgmanagement.saas.modules.notification.entity.NotificationType;
import com.pgmanagement.saas.modules.notification.service.NotificationService;
import com.pgmanagement.saas.modules.property.entity.Property;
import com.pgmanagement.saas.modules.property.service.PropertyService;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.exception.BadRequestException;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import com.pgmanagement.saas.shared.util.MoneyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final BookingService bookingService;
    private final PropertyService propertyService;
    private final NotificationService notificationService;

    @Transactional
    public InvoiceResponse createInvoice(UUID ownerId, CreateInvoiceRequest request) {
        Booking booking = bookingService.findOwnedBookingEntity(request.getBookingId(), ownerId);
        if (booking.getStatus() == BookingStatus.CHECKED_OUT || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot generate an invoice for a closed booking");
        }

        LocalDate normalizedMonth = request.getBillingMonth().withDayOfMonth(1);
        long agreedRentPaise = bookingService.resolveEffectiveAgreedRentPaise(booking, normalizedMonth);
        BigDecimal baseRent = request.getBaseRent() != null
                ? request.getBaseRent()
                : MoneyUtils.toRupees(agreedRentPaise);
        BigDecimal utilityCharges = request.getUtilityCharges() != null
                ? request.getUtilityCharges()
                : BigDecimal.ZERO;
        BigDecimal penaltyFee = request.getPenaltyFee() != null
                ? request.getPenaltyFee()
                : BigDecimal.ZERO;

        long baseRentPaise = MoneyUtils.toPaise(baseRent);
        long additionalChargesPaise = MoneyUtils.toPaise(utilityCharges);
        long penaltyFeePaise = MoneyUtils.toPaise(penaltyFee);
        long totalPaise = baseRentPaise + additionalChargesPaise + penaltyFeePaise;
        BigDecimal totalAmount = MoneyUtils.toRupees(totalPaise);

        String invoiceNumber = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        RentInvoice invoice = RentInvoice.builder()
                .ownerId(ownerId)
                .propertyId(booking.getPropertyId())
                .residentId(booking.getResidentId())
                .bookingId(booking.getId())
                .assignmentId(booking.getId())
                .invoiceNumber(invoiceNumber)
                .billingMonth(normalizedMonth)
                .billingPeriodStart(normalizedMonth)
                .billingPeriodEnd(normalizedMonth.withDayOfMonth(normalizedMonth.lengthOfMonth()))
                .baseRent(baseRent)
                .utilityCharges(utilityCharges)
                .penaltyFee(penaltyFee)
                .totalAmount(totalAmount)
                .paidAmount(BigDecimal.ZERO)
                .baseRentPaise(baseRentPaise)
                .additionalChargesPaise(additionalChargesPaise)
                .penaltyFeePaise(penaltyFeePaise)
                .totalAmountPaise(totalPaise)
                .paidAmountPaise(0L)
                .currency("INR")
                .status(InvoiceStatus.ISSUED)
                .dueDate(request.getDueDate())
                .notes(request.getNotes())
                .build();

        RentInvoice saved = invoiceRepository.save(invoice);
        List<InvoiceItemResponse> items = createLineItems(saved, ownerId, baseRentPaise, additionalChargesPaise, penaltyFeePaise);

        notificationService.createNotification(
                saved.getResidentId(),
                ownerId,
                "New Rent Invoice Issued",
                "Invoice " + saved.getInvoiceNumber() + " for INR " + saved.getTotalAmount() + " is due on " + saved.getDueDate(),
                NotificationType.INVOICE,
                saved.getId()
        );

        return InvoiceResponse.from(saved, items);
    }

    @Transactional
    public GenerateMonthlyInvoicesResponse generateMonthlyInvoices(
            UUID ownerId, GenerateMonthlyInvoicesRequest request) {
        LocalDate normalizedMonth = request.getBillingMonth().withDayOfMonth(1);
        LocalDate periodEnd = normalizedMonth.withDayOfMonth(normalizedMonth.lengthOfMonth());
        if (request.getPropertyId() != null) {
            propertyService.assertActivePropertyOwnedBy(request.getPropertyId(), ownerId);
        }

        List<Booking> openBookings = bookingService.findOpenBookingsForOwner(ownerId, request.getPropertyId());
        Map<UUID, Property> propertyCache = new HashMap<>();
        List<InvoiceResponse> created = new ArrayList<>();
        int skipped = 0;

        BigDecimal utilityCharges = request.getUtilityCharges() != null
                ? request.getUtilityCharges()
                : BigDecimal.ZERO;
        long additionalChargesPaise = MoneyUtils.toPaise(utilityCharges);

        for (Booking booking : openBookings) {
            if (invoiceRepository.existsByBookingIdAndBillingMonthAndStatusNot(
                    booking.getId(), normalizedMonth, InvoiceStatus.CANCELLED)) {
                skipped++;
                continue;
            }

            Property prop = propertyCache.computeIfAbsent(
                    booking.getPropertyId(), propertyService::findEntityForRead);
            int safeDueDay = Math.min(prop.getDefaultBillingDay(), normalizedMonth.lengthOfMonth());
            LocalDate dueDate = normalizedMonth.withDayOfMonth(safeDueDay);

            long baseRentPaise = bookingService.resolveEffectiveAgreedRentPaise(booking, normalizedMonth);
            long totalPaise = baseRentPaise + additionalChargesPaise;
            BigDecimal baseRent = MoneyUtils.toRupees(baseRentPaise);
            BigDecimal totalAmount = MoneyUtils.toRupees(totalPaise);
            String invoiceNumber = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);

            RentInvoice saved = invoiceRepository.save(RentInvoice.builder()
                    .ownerId(ownerId)
                    .propertyId(booking.getPropertyId())
                    .residentId(booking.getResidentId())
                    .bookingId(booking.getId())
                    .assignmentId(booking.getId())
                    .invoiceNumber(invoiceNumber)
                    .billingMonth(normalizedMonth)
                    .billingPeriodStart(normalizedMonth)
                    .billingPeriodEnd(periodEnd)
                    .baseRent(baseRent)
                    .utilityCharges(utilityCharges)
                    .penaltyFee(BigDecimal.ZERO)
                    .totalAmount(totalAmount)
                    .paidAmount(BigDecimal.ZERO)
                    .baseRentPaise(baseRentPaise)
                    .additionalChargesPaise(additionalChargesPaise)
                    .penaltyFeePaise(0L)
                    .totalAmountPaise(totalPaise)
                    .paidAmountPaise(0L)
                    .currency("INR")
                    .status(InvoiceStatus.ISSUED)
                    .dueDate(dueDate)
                    .notes(request.getNotes())
                    .build());

            List<InvoiceItemResponse> items = createLineItems(saved, ownerId, baseRentPaise, additionalChargesPaise, 0L);

            notificationService.createNotification(
                    saved.getResidentId(),
                    ownerId,
                    "Monthly Rent Invoice Issued",
                    "Invoice " + saved.getInvoiceNumber() + " for INR " + saved.getTotalAmount()
                            + " is due on " + saved.getDueDate(),
                    NotificationType.INVOICE,
                    saved.getId()
            );
            created.add(InvoiceResponse.from(saved, items));
        }

        return GenerateMonthlyInvoicesResponse.builder()
                .billingMonth(normalizedMonth)
                .createdCount(created.size())
                .skippedCount(skipped)
                .generatedInvoices(created)
                .build();
    }

    @Transactional
    public List<InvoiceResponse> markOverdueInvoices(UUID ownerId) {
        LocalDate today = LocalDate.now(INDIA_ZONE);
        List<RentInvoice> invoices = invoiceRepository.findAllByOwnerIdOrderByDueDateDesc(ownerId);
        Map<UUID, Property> propertyCache = new HashMap<>();
        List<InvoiceResponse> marked = new ArrayList<>();

        for (RentInvoice invoice : invoices) {
            if (invoice.getStatus() != InvoiceStatus.ISSUED && invoice.getStatus() != InvoiceStatus.PARTIALLY_PAID) {
                continue;
            }
            Property prop = propertyCache.computeIfAbsent(
                    invoice.getPropertyId(), propertyService::findEntityForRead);
            if (invoice.getDueDate().plusDays(prop.getGracePeriodDays()).isBefore(today)) {
                invoice.setStatus(InvoiceStatus.OVERDUE);
                RentInvoice saved = invoiceRepository.save(invoice);
                notificationService.createNotification(
                        saved.getResidentId(),
                        ownerId,
                        "Rent Invoice Overdue",
                        "Invoice " + saved.getInvoiceNumber() + " is now overdue. Please clear the balance.",
                        NotificationType.INVOICE,
                        saved.getId()
                );
                marked.add(InvoiceResponse.from(saved));
            }
        }
        return marked;
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> listInvoices(UUID userId, Role role) {
        List<RentInvoice> invoices = role == Role.OWNER
                ? invoiceRepository.findAllByOwnerIdOrderByDueDateDesc(userId)
                : invoiceRepository.findAllByResidentIdOrderByDueDateDesc(userId);
        return mapWithItems(invoices);
    }

    @Transactional(readOnly = true)
    public PagedResponse<InvoiceResponse> searchInvoices(
            UUID userId,
            Role role,
            InvoiceStatus status,
            boolean overdueOnly,
            UUID propertyId,
            String search,
            int page,
            int size) {
        LocalDate today = LocalDate.now(INDIA_ZONE);
        List<RentInvoice> invoices = role == Role.OWNER
                ? invoiceRepository.findAllByOwnerIdOrderByDueDateDesc(userId)
                : invoiceRepository.findAllByResidentIdOrderByDueDateDesc(userId);

        Map<UUID, Property> propertyCache = new HashMap<>();
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);

        List<RentInvoice> filteredEntities = invoices.stream()
                .filter(inv -> propertyId == null || inv.getPropertyId().equals(propertyId))
                .filter(inv -> status == null || inv.getStatus() == status)
                .filter(inv -> {
                    if (!overdueOnly) {
                        return true;
                    }
                    if (inv.getStatus() == InvoiceStatus.PAID || inv.getStatus() == InvoiceStatus.CANCELLED) {
                        return false;
                    }
                    if (inv.getStatus() == InvoiceStatus.OVERDUE) {
                        return true;
                    }
                    Property prop = propertyCache.computeIfAbsent(
                            inv.getPropertyId(), propertyService::findEntityForRead);
                    return inv.getDueDate().plusDays(prop.getGracePeriodDays()).isBefore(today);
                })
                .filter(inv -> normalizedSearch.isEmpty()
                        || inv.getInvoiceNumber().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                        || (inv.getNotes() != null && inv.getNotes().toLowerCase(Locale.ROOT).contains(normalizedSearch)))
                .toList();

        return PagedResponse.ofList(mapWithItems(filteredEntities), page, size);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(UUID invoiceId, UUID userId, Role role) {
        RentInvoice invoice = findScopedInvoiceEntity(invoiceId, userId, role);
        List<InvoiceItemResponse> items = invoiceItemRepository.findAllByInvoiceIdOrderByCreatedAtAsc(invoice.getId())
                .stream()
                .map(InvoiceItemResponse::from)
                .toList();
        return InvoiceResponse.from(invoice, items);
    }

    @Transactional(readOnly = true)
    public RentInvoice findScopedInvoiceEntity(UUID invoiceId, UUID userId, Role role) {
        return role == Role.OWNER
                ? findOwnedInvoiceEntity(invoiceId, userId)
                : invoiceRepository.findByIdAndResidentId(invoiceId, userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for this resident"));
    }

    @Transactional(readOnly = true)
    public List<InvoiceItemResponse> getInvoiceItems(UUID invoiceId) {
        return invoiceItemRepository.findAllByInvoiceIdOrderByCreatedAtAsc(invoiceId)
                .stream()
                .map(InvoiceItemResponse::from)
                .toList();
    }

    @Transactional
    public InvoiceResponse cancelInvoice(UUID invoiceId, UUID ownerId) {
        RentInvoice invoice = findOwnedInvoiceEntity(invoiceId, ownerId);
        if (invoice.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            throw new BadRequestException("Cannot cancel an invoice that has recorded payments");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BadRequestException("Invoice is already cancelled");
        }
        invoice.setStatus(InvoiceStatus.CANCELLED);
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Transactional(readOnly = true)
    public RentInvoice findOwnedInvoiceEntity(UUID invoiceId, UUID ownerId) {
        return invoiceRepository.findByIdAndOwnerId(invoiceId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for this owner"));
    }

    @Transactional
    public RentInvoice applyPayment(UUID invoiceId, UUID ownerId, BigDecimal paymentAmount) {
        RentInvoice invoice = findOwnedInvoiceEntity(invoiceId, ownerId);
        if (invoice.getStatus() == InvoiceStatus.CANCELLED || invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BadRequestException("Invoice is not open for payment");
        }

        BigDecimal remaining = invoice.getTotalAmount().subtract(invoice.getPaidAmount());
        if (paymentAmount.compareTo(remaining) > 0) {
            throw new BadRequestException("Payment amount exceeds remaining invoice balance");
        }

        BigDecimal newPaid = invoice.getPaidAmount().add(paymentAmount);
        invoice.setPaidAmount(newPaid);
        invoice.setPaidAmountPaise(MoneyUtils.toPaise(newPaid));
        if (newPaid.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaidAt(Instant.now());
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public RentInvoice revertPayment(UUID invoiceId, UUID ownerId, BigDecimal refundAmount) {
        RentInvoice invoice = findOwnedInvoiceEntity(invoiceId, ownerId);
        BigDecimal currentPaid = invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal nextPaid = currentPaid.subtract(refundAmount).max(BigDecimal.ZERO);
        invoice.setPaidAmount(nextPaid);
        invoice.setPaidAmountPaise(MoneyUtils.toPaise(nextPaid));
        if (nextPaid.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else {
            invoice.setPaidAt(null);
            if (nextPaid.compareTo(BigDecimal.ZERO) > 0) {
                invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
            } else {
                LocalDate today = LocalDate.now(INDIA_ZONE);
                invoice.setStatus(invoice.getDueDate().isBefore(today) ? InvoiceStatus.OVERDUE : InvoiceStatus.ISSUED);
            }
        }
        return invoiceRepository.save(invoice);
    }

    private List<InvoiceItemResponse> createLineItems(
            RentInvoice invoice,
            UUID ownerId,
            long baseRentPaise,
            long additionalChargesPaise,
            long penaltyFeePaise) {
        List<InvoiceItem> items = new ArrayList<>();
        if (baseRentPaise > 0) {
            items.add(InvoiceItem.builder()
                    .invoiceId(invoice.getId())
                    .ownerId(ownerId)
                    .itemType(InvoiceItemType.BASE_RENT)
                    .description("Fixed Monthly Rent (" + invoice.getBillingMonth().getMonth() + " " + invoice.getBillingMonth().getYear() + ")")
                    .amountPaise(baseRentPaise)
                    .build());
        }
        if (additionalChargesPaise > 0) {
            items.add(InvoiceItem.builder()
                    .invoiceId(invoice.getId())
                    .ownerId(ownerId)
                    .itemType(InvoiceItemType.ADDITIONAL_CHARGE)
                    .description("Additional & Utility Charges")
                    .amountPaise(additionalChargesPaise)
                    .build());
        }
        if (penaltyFeePaise > 0) {
            items.add(InvoiceItem.builder()
                    .invoiceId(invoice.getId())
                    .ownerId(ownerId)
                    .itemType(InvoiceItemType.PENALTY)
                    .description("Late Payment Fee")
                    .amountPaise(penaltyFeePaise)
                    .build());
        }
        if (items.isEmpty()) {
            return Collections.emptyList();
        }
        return invoiceItemRepository.saveAll(items).stream().map(InvoiceItemResponse::from).toList();
    }

    private List<InvoiceResponse> mapWithItems(List<RentInvoice> invoices) {
        if (invoices.isEmpty()) {
            return Collections.emptyList();
        }
        List<UUID> ids = invoices.stream().map(RentInvoice::getId).toList();
        Map<UUID, List<InvoiceItemResponse>> itemsByInvoice = new HashMap<>();
        for (InvoiceItem item : invoiceItemRepository.findAllByInvoiceIdInOrderByCreatedAtAsc(ids)) {
            itemsByInvoice.computeIfAbsent(item.getInvoiceId(), k -> new ArrayList<>())
                    .add(InvoiceItemResponse.from(item));
        }
        return invoices.stream()
                .map(inv -> InvoiceResponse.from(inv, itemsByInvoice.getOrDefault(inv.getId(), Collections.emptyList())))
                .toList();
    }
}
