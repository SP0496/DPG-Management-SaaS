package com.pgmanagement.saas.modules.payment.service;

import com.pgmanagement.saas.modules.booking.entity.Booking;
import com.pgmanagement.saas.modules.booking.repository.BookingRepository;
import com.pgmanagement.saas.modules.invoice.entity.RentInvoice;
import com.pgmanagement.saas.modules.invoice.repository.InvoiceRepository;
import com.pgmanagement.saas.modules.invoice.service.InvoiceService;
import com.pgmanagement.saas.modules.notification.entity.NotificationType;
import com.pgmanagement.saas.modules.notification.service.NotificationService;
import com.pgmanagement.saas.modules.owner.entity.OwnerProfile;
import com.pgmanagement.saas.modules.owner.repository.OwnerProfileRepository;
import com.pgmanagement.saas.modules.payment.dto.request.RecordPaymentRequest;
import com.pgmanagement.saas.modules.payment.dto.response.PaymentReceiptResponse;
import com.pgmanagement.saas.modules.payment.dto.response.PaymentResponse;
import com.pgmanagement.saas.modules.payment.entity.Payment;
import com.pgmanagement.saas.modules.payment.entity.PaymentMethod;
import com.pgmanagement.saas.modules.payment.entity.PaymentStatus;
import com.pgmanagement.saas.modules.payment.repository.PaymentRepository;
import com.pgmanagement.saas.modules.property.entity.Property;
import com.pgmanagement.saas.modules.property.service.PropertyService;
import com.pgmanagement.saas.modules.room.entity.Bed;
import com.pgmanagement.saas.modules.room.entity.Room;
import com.pgmanagement.saas.modules.room.service.RoomService;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.modules.users.entity.User;
import com.pgmanagement.saas.modules.users.repository.UserRepository;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.exception.BadRequestException;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final DateTimeFormatter RECEIPT_DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm 'IST'").withZone(ZoneId.of("Asia/Kolkata"));

    private final PaymentRepository paymentRepository;
    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;
    private final PropertyService propertyService;
    private final RoomService roomService;
    private final BookingRepository bookingRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public PaymentResponse recordPayment(UUID ownerId, RecordPaymentRequest request) {
        String idempotencyKey = trimOrNull(request.getIdempotencyKey());
        if (idempotencyKey != null) {
            Optional<Payment> existing = paymentRepository.findByIdempotencyKeyAndOwnerId(idempotencyKey, ownerId);
            if (existing.isPresent()) {
                return PaymentResponse.from(existing.get());
            }
        }

        RentInvoice updatedInvoice = invoiceService.applyPayment(request.getInvoiceId(), ownerId, request.getAmount());

        Payment payment = Payment.builder()
                .ownerId(ownerId)
                .residentId(updatedInvoice.getResidentId())
                .invoiceId(updatedInvoice.getId())
                .idempotencyKey(idempotencyKey)
                .paymentMethod(request.getPaymentMethod())
                .amount(request.getAmount())
                .currency(updatedInvoice.getCurrency())
                .referenceNumber(trimOrNull(request.getReferenceNumber()))
                .status(PaymentStatus.COMPLETED)
                .notes(trimOrNull(request.getNotes()))
                .paidAt(Instant.now())
                .build();

        Payment saved = paymentRepository.save(payment);

        notificationService.createNotification(
                saved.getResidentId(),
                ownerId,
                "Payment Recorded",
                "Payment of INR " + saved.getAmount() + " recorded for invoice " + updatedInvoice.getInvoiceNumber(),
                NotificationType.PAYMENT,
                saved.getId()
        );

        return PaymentResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listPayments(UUID userId, Role role) {
        List<Payment> payments = role == Role.OWNER
                ? paymentRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)
                : paymentRepository.findAllByResidentIdOrderByCreatedAtDesc(userId);
        return payments.stream().map(PaymentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<PaymentResponse> searchPayments(
            UUID userId, Role role, PaymentMethod paymentMethod, String search, int page, int size) {
        List<Payment> payments = role == Role.OWNER
                ? paymentRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)
                : paymentRepository.findAllByResidentIdOrderByCreatedAtDesc(userId);
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);

        List<PaymentResponse> filtered = payments.stream()
                .filter(p -> paymentMethod == null || p.getPaymentMethod() == paymentMethod)
                .filter(p -> normalizedSearch.isEmpty()
                        || (p.getReferenceNumber() != null
                                && p.getReferenceNumber().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                        || (p.getNotes() != null && p.getNotes().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                        || p.getPaymentMethod().name().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                .map(PaymentResponse::from)
                .toList();
        return PagedResponse.ofList(filtered, page, size);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID paymentId, UUID userId, Role role) {
        return PaymentResponse.from(findScopedPayment(paymentId, userId, role));
    }

    @Transactional(readOnly = true)
    public PaymentReceiptResponse getPaymentReceipt(UUID paymentId, UUID userId, Role role) {
        Payment payment = findScopedPayment(paymentId, userId, role);
        if (payment.getStatus() != PaymentStatus.COMPLETED && payment.getStatus() != PaymentStatus.REFUNDED) {
            throw new BadRequestException("Official rent receipt is only available for completed or refunded payments");
        }
        RentInvoice invoice = invoiceRepository.findById(payment.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Linked rent invoice not found"));

        Property property = propertyService.findEntityForRead(invoice.getPropertyId());
        Booking booking = bookingRepository.findById(invoice.getBookingId()).orElse(null);
        Room room = booking != null ? roomService.findRoomEntityForRead(booking.getRoomId()) : null;
        Bed bed = booking != null ? roomService.findBedEntityForRead(booking.getBedId()) : null;
        OwnerProfile ownerProfile = ownerProfileRepository.findByUserId(payment.getOwnerId()).orElse(null);
        User ownerUser = userRepository.findById(payment.getOwnerId()).orElse(null);
        User residentUser = userRepository.findById(payment.getResidentId()).orElse(null);

        String formattedAddress = Stream.of(
                        property.getAddressLine1(),
                        property.getAddressLine2(),
                        property.getCity(),
                        property.getState(),
                        property.getPostalCode())
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining(", "));

        String receiptNumber = "RCP-" + payment.getId().toString().substring(0, 8).toUpperCase(Locale.ROOT);

        return PaymentReceiptResponse.builder()
                .receiptNumber(receiptNumber)
                .paymentId(payment.getId())
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .billingMonth(invoice.getBillingMonth())
                .propertyName(property.getName())
                .propertyAddress(formattedAddress)
                .roomNumber(room != null ? room.getRoomNumber() : "-")
                .bedNumber(bed != null ? bed.getBedCode() : "-")
                .ownerBusinessName(ownerProfile != null && ownerProfile.getBusinessName() != null
                        ? ownerProfile.getBusinessName()
                        : (ownerUser != null ? ownerUser.getFullName() : "PG Management"))
                .ownerPhone(ownerUser != null ? ownerUser.getPhone() : property.getEmergencyContact())
                .residentName(residentUser != null ? residentUser.getFullName() : "PG Resident")
                .residentPhone(residentUser != null ? residentUser.getPhone() : "-")
                .paymentMethod(payment.getPaymentMethod())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .referenceNumber(payment.getReferenceNumber())
                .status(payment.getStatus())
                .notes(payment.getNotes())
                .paidAt(payment.getPaidAt())
                .build();
    }

    public String renderReceiptHtml(PaymentReceiptResponse receipt) {
        String paidTime = receipt.getPaidAt() != null ? RECEIPT_DATE_FMT.format(receipt.getPaidAt()) : "-";
        return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\">"
                + "<title>Rent Receipt " + escapeHtml(receipt.getReceiptNumber()) + "</title>"
                + "<style>"
                + "body{font-family:Arial,sans-serif;background:#EAF6FF;color:#142B4A;padding:24px;margin:0;}"
                + ".card{max-width:640px;margin:0 auto;background:#FFFFFF;border:2px solid #142B4A;border-radius:12px;padding:24px;}"
                + ".hdr{background:#142B4A;color:#EAF6FF;padding:16px 20px;border-radius:8px;margin-bottom:18px;}"
                + ".tag{color:#FF8C42;font-size:12px;font-weight:700;letter-spacing:1px;}"
                + "h1{margin:6px 0 4px;font-size:20px;}"
                + "table{width:100%;border-collapse:collapse;margin-top:12px;}"
                + "td{padding:8px 6px;border-bottom:1px solid #D3E7F7;font-size:14px;}"
                + "td.lbl{font-weight:700;width:42%;}"
                + ".amt{background:#FFF0E5;border:1px solid #FF8C42;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:18px;font-weight:700;}"
                + "</style></head><body><div class=\"card\">"
                + "<div class=\"hdr\"><div class=\"tag\">OFFICIAL RENT RECEIPT</div>"
                + "<h1>" + escapeHtml(receipt.getOwnerBusinessName()) + "</h1>"
                + "<div>Receipt No: " + escapeHtml(receipt.getReceiptNumber()) + "</div></div>"
                + "<table>"
                + row("Resident", receipt.getResidentName() + " (" + receipt.getResidentPhone() + ")")
                + row("Property", receipt.getPropertyName() + " - " + receipt.getPropertyAddress())
                + row("Room & Bed", "Room " + receipt.getRoomNumber() + " / Bed " + receipt.getBedNumber())
                + row("Invoice Number", receipt.getInvoiceNumber())
                + row("Billing Month", String.valueOf(receipt.getBillingMonth()))
                + row("Payment Method", String.valueOf(receipt.getPaymentMethod()))
                + row("Reference Number", receipt.getReferenceNumber() != null ? receipt.getReferenceNumber() : "-")
                + row("Payment Status", String.valueOf(receipt.getStatus()))
                + row("Paid Timestamp", paidTime)
                + row("Notes", receipt.getNotes() != null ? receipt.getNotes() : "-")
                + "</table>"
                + "<div class=\"amt\">Total Paid: " + escapeHtml(receipt.getCurrency()) + " "
                + escapeHtml(String.valueOf(receipt.getAmount())) + "</div>"
                + "</div></body></html>";
    }

    private String row(String label, String value) {
        return "<tr><td class=\"lbl\">" + escapeHtml(label) + "</td><td>" + escapeHtml(value) + "</td></tr>";
    }

    private String escapeHtml(String input) {
        return HtmlUtils.htmlEscape(input == null ? "" : input);
    }

    private Payment findScopedPayment(UUID paymentId, UUID userId, Role role) {
        return role == Role.OWNER
                ? paymentRepository.findByIdAndOwnerId(paymentId, userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Payment record not found for this owner"))
                : paymentRepository.findByIdAndResidentId(paymentId, userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Payment record not found for this resident"));
    }

    private String trimOrNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
