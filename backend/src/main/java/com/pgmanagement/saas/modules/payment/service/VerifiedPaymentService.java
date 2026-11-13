package com.pgmanagement.saas.modules.payment.service;

import com.pgmanagement.saas.modules.booking.entity.Booking;
import com.pgmanagement.saas.modules.booking.repository.BookingRepository;
import com.pgmanagement.saas.modules.invoice.dto.response.InvoiceItemResponse;
import com.pgmanagement.saas.modules.invoice.entity.InvoiceStatus;
import com.pgmanagement.saas.modules.invoice.entity.RentInvoice;
import com.pgmanagement.saas.modules.invoice.repository.InvoiceRepository;
import com.pgmanagement.saas.modules.invoice.service.InvoiceService;
import com.pgmanagement.saas.modules.notification.entity.NotificationType;
import com.pgmanagement.saas.modules.notification.service.NotificationService;
import com.pgmanagement.saas.modules.owner.entity.OwnerProfile;
import com.pgmanagement.saas.modules.owner.repository.OwnerProfileRepository;
import com.pgmanagement.saas.modules.payment.dto.request.ConfirmPaymentSubmissionRequest;
import com.pgmanagement.saas.modules.payment.dto.request.RejectPaymentSubmissionRequest;
import com.pgmanagement.saas.modules.payment.dto.request.SubmitDirectPaymentRequest;
import com.pgmanagement.saas.modules.payment.dto.response.PaymentReceiptResponse;
import com.pgmanagement.saas.modules.payment.dto.response.PaymentSubmissionResponse;
import com.pgmanagement.saas.modules.payment.dto.response.RentLedgerEntryResponse;
import com.pgmanagement.saas.modules.payment.dto.response.ResidentCheckoutDetailsResponse;
import com.pgmanagement.saas.modules.payment.entity.Payment;
import com.pgmanagement.saas.modules.payment.entity.PaymentAuditLog;
import com.pgmanagement.saas.modules.payment.entity.PaymentConfirmation;
import com.pgmanagement.saas.modules.payment.entity.PaymentStatus;
import com.pgmanagement.saas.modules.payment.entity.PaymentSubmission;
import com.pgmanagement.saas.modules.payment.entity.PaymentSubmissionStatus;
import com.pgmanagement.saas.modules.payment.repository.PaymentAuditLogRepository;
import com.pgmanagement.saas.modules.payment.repository.PaymentConfirmationRepository;
import com.pgmanagement.saas.modules.payment.repository.PaymentRepository;
import com.pgmanagement.saas.modules.payment.repository.PaymentSubmissionRepository;
import com.pgmanagement.saas.modules.property.entity.Property;
import com.pgmanagement.saas.modules.property.repository.PropertyRepository;
import com.pgmanagement.saas.modules.room.entity.Bed;
import com.pgmanagement.saas.modules.room.entity.Room;
import com.pgmanagement.saas.modules.room.repository.BedRepository;
import com.pgmanagement.saas.modules.room.repository.RoomRepository;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.modules.users.entity.User;
import com.pgmanagement.saas.modules.users.repository.UserRepository;
import com.pgmanagement.saas.shared.exception.BadRequestException;
import com.pgmanagement.saas.shared.exception.ConflictException;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import com.pgmanagement.saas.shared.util.MoneyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerifiedPaymentService {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yyyy");

    private final PaymentSubmissionRepository submissionRepository;
    private final PaymentConfirmationRepository confirmationRepository;
    private final PaymentAuditLogRepository auditLogRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PaymentService paymentService;
    private final PdfDocumentService pdfDocumentService;

    @Transactional(readOnly = true)
    public ResidentCheckoutDetailsResponse getResidentCheckoutDetails(UUID invoiceId, UUID residentId) {
        RentInvoice invoice = invoiceRepository.findByIdAndResidentId(invoiceId, residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for this resident"));

        Booking booking = bookingRepository.findById(invoice.getBookingId()).orElse(null);
        Property property = propertyRepository.findById(invoice.getPropertyId()).orElse(null);
        Room room = booking != null ? roomRepository.findById(booking.getRoomId()).orElse(null) : null;
        Bed bed = booking != null ? bedRepository.findById(booking.getBedId()).orElse(null) : null;
        OwnerProfile ownerProfile = ownerProfileRepository.findByUserId(invoice.getOwnerId()).orElse(null);
        User resident = userRepository.findById(invoice.getResidentId()).orElse(null);
        List<InvoiceItemResponse> items = invoiceService.getInvoiceItems(invoice.getId());

        long basePaise = resolveInvoiceBasePaise(invoice);
        long addPaise = resolveInvoiceAddPaise(invoice);
        long penPaise = resolveInvoicePenaltyPaise(invoice);
        long totalPaise = resolveInvoiceTotalPaise(invoice);
        long paidPaise = resolveInvoicePaidPaise(invoice);
        long outstandingPaise = Math.max(0L, totalPaise - paidPaise);

        String ownerBusiness = ownerProfile != null && ownerProfile.getBusinessName() != null
                ? ownerProfile.getBusinessName()
                : "PG Management";
        String payeeName = ownerProfile != null && ownerProfile.getUpiPayeeName() != null
                ? ownerProfile.getUpiPayeeName()
                : ownerBusiness;
        String ownerUpiId = ownerProfile != null ? ownerProfile.getUpiId() : null;

        String upiDeepLink = buildUpiDeepLink(
                ownerUpiId,
                payeeName,
                MoneyUtils.toRupees(outstandingPaise > 0 ? outstandingPaise : totalPaise),
                invoice.getInvoiceNumber(),
                property != null ? property.getName() : ownerBusiness);

        return ResidentCheckoutDetailsResponse.builder()
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .billingMonth(invoice.getBillingMonth())
                .dueDate(invoice.getDueDate())
                .status(invoice.getStatus())
                .fixedMonthlyRentPaise(basePaise)
                .additionalChargesPaise(addPaise)
                .penaltyFeePaise(penPaise)
                .totalAmountPaise(totalPaise)
                .paidAmountPaise(paidPaise)
                .outstandingAmountPaise(outstandingPaise)
                .fixedMonthlyRent(MoneyUtils.toRupees(basePaise))
                .additionalCharges(MoneyUtils.toRupees(addPaise))
                .penaltyFee(MoneyUtils.toRupees(penPaise))
                .totalAmount(MoneyUtils.toRupees(totalPaise))
                .paidAmount(MoneyUtils.toRupees(paidPaise))
                .outstandingAmount(MoneyUtils.toRupees(outstandingPaise))
                .items(items)
                .propertyName(property != null ? property.getName() : "PG Property")
                .floorNumber(room != null ? room.getFloorNumber() : 0)
                .roomNumber(room != null ? room.getRoomNumber() : "-")
                .bedCode(bed != null ? bed.getBedCode() : "-")
                .residentName(resident != null ? resident.getFullName() : "Resident")
                .ownerBusinessName(ownerBusiness)
                .ownerUpiId(ownerUpiId)
                .ownerUpiPayeeName(payeeName)
                .upiDeepLink(upiDeepLink)
                .bankAccountHolder(ownerProfile != null ? ownerProfile.getBankAccountHolder() : null)
                .bankName(ownerProfile != null ? ownerProfile.getBankName() : null)
                .bankAccountNumber(ownerProfile != null ? ownerProfile.getBankAccountNumber() : null)
                .bankIfscCode(ownerProfile != null ? ownerProfile.getBankIfscCode() : null)
                .bankVerificationAvailable(false)
                .verificationNotice("Automated bank/acquirer transaction API is awaiting bank API access. Submitted payments enter PENDING_VERIFICATION until verified against the PG owner's bank statement.")
                .build();
    }

    @Transactional
    public PaymentSubmissionResponse submitDirectPayment(UUID residentId, SubmitDirectPaymentRequest request) {
        String idempotencyKey = request.getIdempotencyKey().trim();
        Optional<PaymentSubmission> existingByKey = submissionRepository.findByIdempotencyKey(idempotencyKey);
        if (existingByKey.isPresent()) {
            PaymentSubmission existing = existingByKey.get();
            if (!existing.getResidentId().equals(residentId)) {
                throw new ConflictException("Idempotency key belongs to a different resident");
            }
            return mapSubmission(existing);
        }

        RentInvoice invoice = invoiceRepository.findByIdAndResidentId(request.getInvoiceId(), residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for this resident"));

        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BadRequestException("Invoice is already " + invoice.getStatus().name() + " and cannot accept submissions");
        }

        long remainingPaise = Math.max(0L, resolveInvoiceTotalPaise(invoice) - resolveInvoicePaidPaise(invoice));
        if (remainingPaise <= 0) {
            throw new BadRequestException("No outstanding balance remains on this invoice");
        }

        long amountPaise = request.getAmount() != null
                ? MoneyUtils.toPaise(request.getAmount())
                : remainingPaise;
        if (amountPaise <= 0 || amountPaise > remainingPaise) {
            throw new BadRequestException("Submitted payment amount must be between INR 1.00 and remaining balance INR "
                    + MoneyUtils.toRupees(remainingPaise));
        }

        long pendingPaise = submissionRepository.findAllByInvoiceIdOrderBySubmittedAtDesc(invoice.getId()).stream()
                .filter(s -> s.getStatus() == PaymentSubmissionStatus.PENDING_VERIFICATION)
                .mapToLong(PaymentSubmission::getAmountPaise)
                .sum();
        if (pendingPaise + amountPaise > remainingPaise) {
            throw new ConflictException("Another payment submission for this invoice is already awaiting owner verification");
        }

        String trimmedUtr = request.getUtrReference().trim();
        String normalizedUtr = trimmedUtr.toUpperCase(Locale.ROOT);
        if (submissionRepository.existsByOwnerIdAndNormalizedUtr(invoice.getOwnerId(), normalizedUtr)) {
            throw new ConflictException("UTR / transaction reference " + trimmedUtr + " has already been submitted");
        }

        Booking booking = bookingRepository.findById(invoice.getBookingId()).orElse(null);
        Room room = booking != null ? roomRepository.findById(booking.getRoomId()).orElse(null) : null;
        Property property = propertyRepository.findById(invoice.getPropertyId()).orElse(null);
        User resident = userRepository.findById(residentId).orElse(null);

        Instant now = Instant.now();
        PaymentSubmission saved = submissionRepository.save(PaymentSubmission.builder()
                .ownerId(invoice.getOwnerId())
                .propertyId(invoice.getPropertyId())
                .floorNumber(room != null ? room.getFloorNumber() : 0)
                .roomNumber(room != null ? room.getRoomNumber() : "-")
                .residentId(residentId)
                .invoiceId(invoice.getId())
                .idempotencyKey(idempotencyKey)
                .paymentMethod(request.getPaymentMethod())
                .amountPaise(amountPaise)
                .currency("INR")
                .utrReference(trimmedUtr)
                .normalizedUtr(normalizedUtr)
                .payerUpiId(trimOrNull(request.getPayerUpiId()))
                .payerName(trimOrNull(request.getPayerName()))
                .bankName(trimOrNull(request.getBankName()))
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now(INDIA_ZONE))
                .notes(trimOrNull(request.getNotes()))
                .status(PaymentSubmissionStatus.PENDING_VERIFICATION)
                .submittedAt(now)
                .build());

        auditLogRepository.save(PaymentAuditLog.builder()
                .submissionId(saved.getId())
                .invoiceId(invoice.getId())
                .ownerId(invoice.getOwnerId())
                .residentId(residentId)
                .actorUserId(residentId)
                .actorRole(Role.RESIDENT.name())
                .action("PAYMENT_SUBMITTED")
                .previousStatus(null)
                .newStatus(PaymentSubmissionStatus.PENDING_VERIFICATION.name())
                .details("Method=" + request.getPaymentMethod() + ", UTR=" + trimmedUtr + ", AmountPaise=" + amountPaise)
                .build());

        String residentLabel = resident != null ? resident.getFullName() : "Resident";
        String propertyLabel = property != null ? property.getName() : "PG Property";
        String roomLabel = room != null ? ("Room " + room.getRoomNumber()) : "Room -";

        notificationService.createNotification(
                invoice.getOwnerId(),
                invoice.getOwnerId(),
                "Rent Payment Awaiting Verification",
                residentLabel + " submitted " + MoneyUtils.formatInrFromPaise(amountPaise)
                        + " via " + request.getPaymentMethod().name()
                        + " for " + roomLabel + " (" + propertyLabel + ")."
                        + " UTR/Ref: " + trimmedUtr + ". Verify against your bank statement.",
                NotificationType.PAYMENT,
                invoice.getId(),
                "PAYMENT_SUBMISSION",
                saved.getId()
        );

        return mapSubmission(saved);
    }

    @Transactional(readOnly = true)
    public PaymentSubmissionResponse getSubmission(UUID submissionId, UUID userId, Role role) {
        PaymentSubmission submission = findScopedSubmission(submissionId, userId, role);
        return mapSubmission(submission);
    }

    @Transactional(readOnly = true)
    public List<PaymentSubmissionResponse> listSubmissions(
            UUID userId,
            Role role,
            UUID propertyId,
            Integer floorNumber,
            String roomNumber,
            UUID residentId,
            String billingMonth,
            PaymentSubmissionStatus status,
            String search) {
        List<PaymentSubmission> raw = role == Role.OWNER
                ? submissionRepository.findAllByOwnerIdOrderBySubmittedAtDesc(userId)
                : submissionRepository.findAllByResidentIdOrderBySubmittedAtDesc(userId);
        return filterAndMapSubmissions(raw, propertyId, floorNumber, roomNumber, residentId, billingMonth, status, search);
    }

    @Transactional
    public PaymentSubmissionResponse confirmSubmission(
            UUID submissionId, UUID ownerId, ConfirmPaymentSubmissionRequest request) {
        PaymentSubmission submission = submissionRepository.findByIdAndOwnerId(submissionId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment submission not found for this owner"));
        if (submission.getStatus() != PaymentSubmissionStatus.PENDING_VERIFICATION) {
            throw new BadRequestException("Submission is already " + submission.getStatus().name());
        }

        BigDecimal verifiedRupees = MoneyUtils.toRupees(submission.getAmountPaise());
        RentInvoice updatedInvoice = invoiceService.applyPayment(submission.getInvoiceId(), ownerId, verifiedRupees);

        String receiptNumber = "RCPT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        Instant now = Instant.now();

        Payment recordedPayment = paymentRepository.save(Payment.builder()
                .ownerId(ownerId)
                .residentId(submission.getResidentId())
                .invoiceId(submission.getInvoiceId())
                .idempotencyKey("sub-" + submission.getId())
                .paymentMethod(submission.getPaymentMethod())
                .amount(verifiedRupees)
                .currency("INR")
                .referenceNumber(submission.getUtrReference())
                .status(PaymentStatus.COMPLETED)
                .notes(request != null && request.getRemarks() != null && !request.getRemarks().isBlank()
                        ? request.getRemarks().trim()
                        : submission.getNotes())
                .paidAt(now)
                .build());

        submission.setStatus(PaymentSubmissionStatus.CONFIRMED);
        PaymentSubmission savedSub = submissionRepository.save(submission);

        String ownerRemarks = request != null ? trimOrNull(request.getRemarks()) : null;
        confirmationRepository.save(PaymentConfirmation.builder()
                .submissionId(savedSub.getId())
                .invoiceId(savedSub.getInvoiceId())
                .ownerId(ownerId)
                .residentId(savedSub.getResidentId())
                .paymentId(recordedPayment.getId())
                .decision(PaymentSubmissionStatus.CONFIRMED)
                .verifiedByOwnerId(ownerId)
                .verificationSource("OWNER_MANUAL_RECONCILIATION")
                .receiptNumber(receiptNumber)
                .confirmedAmountPaise(savedSub.getAmountPaise())
                .remarks(ownerRemarks)
                .decidedAt(now)
                .build());

        auditLogRepository.save(PaymentAuditLog.builder()
                .submissionId(savedSub.getId())
                .invoiceId(savedSub.getInvoiceId())
                .ownerId(ownerId)
                .residentId(savedSub.getResidentId())
                .actorUserId(ownerId)
                .actorRole(Role.OWNER.name())
                .action("PAYMENT_CONFIRMED")
                .previousStatus(PaymentSubmissionStatus.PENDING_VERIFICATION.name())
                .newStatus(PaymentSubmissionStatus.CONFIRMED.name())
                .details("Receipt=" + receiptNumber + ", UTR=" + savedSub.getUtrReference()
                        + ", VerificationSource=OWNER_MANUAL_RECONCILIATION")
                .build());

        long remainingPaise = Math.max(0L, resolveInvoiceTotalPaise(updatedInvoice) - resolveInvoicePaidPaise(updatedInvoice));
        Property prop = propertyRepository.findById(savedSub.getPropertyId()).orElse(null);

        notificationService.createNotification(
                savedSub.getResidentId(),
                ownerId,
                "Payment Verified & Receipt Ready",
                "Payment of " + MoneyUtils.formatInrFromPaise(savedSub.getAmountPaise())
                        + " for " + (prop != null ? prop.getName() : "PG")
                        + " Floor " + savedSub.getFloorNumber()
                        + " Room " + savedSub.getRoomNumber()
                        + " (" + MONTH_LABEL.format(updatedInvoice.getBillingMonth()) + ")"
                        + " is VERIFIED. UTR: " + savedSub.getUtrReference()
                        + ". Receipt #" + receiptNumber
                        + ". Remaining balance: " + MoneyUtils.formatInrFromPaise(remainingPaise) + ".",
                NotificationType.PAYMENT,
                savedSub.getInvoiceId(),
                "PAYMENT_VERIFIED",
                savedSub.getId()
        );

        return mapSubmission(savedSub);
    }

    @Transactional
    public PaymentSubmissionResponse rejectSubmission(
            UUID submissionId, UUID ownerId, RejectPaymentSubmissionRequest request) {
        PaymentSubmission submission = submissionRepository.findByIdAndOwnerId(submissionId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment submission not found for this owner"));
        if (submission.getStatus() != PaymentSubmissionStatus.PENDING_VERIFICATION) {
            throw new BadRequestException("Submission is already " + submission.getStatus().name());
        }

        String reason = request.getReason().trim();
        Instant now = Instant.now();
        submission.setStatus(PaymentSubmissionStatus.REJECTED);
        submission.setRejectionReason(reason);
        PaymentSubmission savedSub = submissionRepository.save(submission);

        confirmationRepository.save(PaymentConfirmation.builder()
                .submissionId(savedSub.getId())
                .invoiceId(savedSub.getInvoiceId())
                .ownerId(ownerId)
                .residentId(savedSub.getResidentId())
                .paymentId(null)
                .decision(PaymentSubmissionStatus.REJECTED)
                .verifiedByOwnerId(ownerId)
                .verificationSource("OWNER_MANUAL_RECONCILIATION")
                .receiptNumber(null)
                .confirmedAmountPaise(0L)
                .remarks(reason)
                .decidedAt(now)
                .build());

        auditLogRepository.save(PaymentAuditLog.builder()
                .submissionId(savedSub.getId())
                .invoiceId(savedSub.getInvoiceId())
                .ownerId(ownerId)
                .residentId(savedSub.getResidentId())
                .actorUserId(ownerId)
                .actorRole(Role.OWNER.name())
                .action("PAYMENT_REJECTED")
                .previousStatus(PaymentSubmissionStatus.PENDING_VERIFICATION.name())
                .newStatus(PaymentSubmissionStatus.REJECTED.name())
                .details("Reason=" + reason + ", UTR=" + savedSub.getUtrReference())
                .build());

        notificationService.createNotification(
                savedSub.getResidentId(),
                ownerId,
                "Payment Verification Rejected",
                "Payment submission (" + MoneyUtils.formatInrFromPaise(savedSub.getAmountPaise())
                        + ", UTR " + savedSub.getUtrReference() + ") was rejected: " + reason
                        + ". Please verify your bank statement and submit a corrected payment reference.",
                NotificationType.PAYMENT,
                savedSub.getInvoiceId(),
                "PAYMENT_REJECTED",
                savedSub.getId()
        );

        return mapSubmission(savedSub);
    }

    @Transactional(readOnly = true)
    public List<RentLedgerEntryResponse> getRentLedger(
            UUID ownerId,
            UUID propertyId,
            Integer floorNumber,
            String roomNumber,
            UUID residentId,
            String billingMonth,
            String statusFilter,
            String search) {
        List<PaymentSubmission> subs = submissionRepository.findAllByOwnerIdOrderBySubmittedAtDesc(ownerId);
        List<PaymentSubmissionResponse> mappedSubs = filterAndMapSubmissions(
                subs, propertyId, floorNumber, roomNumber, residentId, billingMonth, null, search);

        Map<UUID, Payment> paymentById = new HashMap<>();
        Set<UUID> confirmedPaymentIds = new HashSet<>();
        for (PaymentSubmissionResponse sub : mappedSubs) {
            if (sub.getPaymentId() != null) {
                confirmedPaymentIds.add(sub.getPaymentId());
            }
        }

        List<RentLedgerEntryResponse> entries = new ArrayList<>();
        for (PaymentSubmissionResponse sub : mappedSubs) {
            if (statusFilter != null && !statusFilter.isBlank()
                    && !sub.getStatus().name().equalsIgnoreCase(statusFilter.trim())) {
                continue;
            }
            entries.add(RentLedgerEntryResponse.builder()
                    .id(sub.getId())
                    .submissionId(sub.getId())
                    .paymentId(sub.getPaymentId())
                    .invoiceId(sub.getInvoiceId())
                    .propertyId(sub.getPropertyId())
                    .propertyName(sub.getPropertyName())
                    .floorNumber(sub.getFloorNumber())
                    .roomNumber(sub.getRoomNumber())
                    .residentId(sub.getResidentId())
                    .residentName(sub.getResidentName())
                    .invoiceNumber(sub.getInvoiceNumber())
                    .billingMonth(sub.getBillingMonth())
                    .amount(sub.getAmount())
                    .amountPaise(sub.getAmountPaise())
                    .paymentMethod(sub.getPaymentMethod())
                    .referenceNumber(sub.getUtrReference())
                    .paymentDate(sub.getPaymentDate())
                    .status(sub.getStatus().name())
                    .receiptNumber(sub.getReceiptNumber())
                    .build());
        }

        List<Payment> payments = paymentRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId);
        for (Payment p : payments) {
            if (confirmedPaymentIds.contains(p.getId())) {
                continue;
            }
            paymentById.put(p.getId(), p);
        }

        if (!paymentById.isEmpty()) {
            String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
            for (Payment p : paymentById.values()) {
                RentInvoice inv = invoiceRepository.findById(p.getInvoiceId()).orElse(null);
                UUID invPropertyId = inv != null ? inv.getPropertyId() : null;
                Booking booking = inv != null ? bookingRepository.findById(inv.getBookingId()).orElse(null) : null;
                Room room = booking != null ? roomRepository.findById(booking.getRoomId()).orElse(null) : null;
                Property prop = invPropertyId != null ? propertyRepository.findById(invPropertyId).orElse(null) : null;
                User res = userRepository.findById(p.getResidentId()).orElse(null);

                int fl = room != null ? room.getFloorNumber() : 0;
                String rm = room != null ? room.getRoomNumber() : "-";
                LocalDate bMonth = inv != null ? inv.getBillingMonth() : null;
                String mappedStatus = p.getStatus() == PaymentStatus.COMPLETED ? "CONFIRMED" : p.getStatus().name();

                if (propertyId != null && !propertyId.equals(invPropertyId)) continue;
                if (floorNumber != null && fl != floorNumber) continue;
                if (roomNumber != null && !roomNumber.isBlank() && !rm.equalsIgnoreCase(roomNumber.trim())) continue;
                if (residentId != null && !p.getResidentId().equals(residentId)) continue;
                if (billingMonth != null && !billingMonth.isBlank()
                        && (bMonth == null || !bMonth.toString().startsWith(billingMonth.trim()))) continue;
                if (statusFilter != null && !statusFilter.isBlank()
                        && !mappedStatus.equalsIgnoreCase(statusFilter.trim())
                        && !p.getStatus().name().equalsIgnoreCase(statusFilter.trim())) continue;

                String rName = res != null ? res.getFullName() : "Resident";
                String pName = prop != null ? prop.getName() : "PG Property";
                String invNum = inv != null ? inv.getInvoiceNumber() : "-";
                if (!normalizedSearch.isEmpty()) {
                    boolean match = rName.toLowerCase(Locale.ROOT).contains(normalizedSearch)
                            || pName.toLowerCase(Locale.ROOT).contains(normalizedSearch)
                            || invNum.toLowerCase(Locale.ROOT).contains(normalizedSearch)
                            || (p.getReferenceNumber() != null && p.getReferenceNumber().toLowerCase(Locale.ROOT).contains(normalizedSearch));
                    if (!match) continue;
                }

                LocalDate pDate = p.getPaidAt() != null
                        ? p.getPaidAt().atZone(INDIA_ZONE).toLocalDate()
                        : LocalDate.now(INDIA_ZONE);
                String rcptNum = "RCPT-" + p.getId().toString().substring(0, 8).toUpperCase(Locale.ROOT);
                entries.add(RentLedgerEntryResponse.builder()
                        .id(p.getId())
                        .submissionId(null)
                        .paymentId(p.getId())
                        .invoiceId(p.getInvoiceId())
                        .propertyId(invPropertyId)
                        .propertyName(pName)
                        .floorNumber(fl)
                        .roomNumber(rm)
                        .residentId(p.getResidentId())
                        .residentName(rName)
                        .invoiceNumber(invNum)
                        .billingMonth(bMonth)
                        .amount(p.getAmount())
                        .amountPaise(MoneyUtils.toPaise(p.getAmount()))
                        .paymentMethod(p.getPaymentMethod())
                        .referenceNumber(p.getReferenceNumber())
                        .paymentDate(pDate)
                        .status(mappedStatus)
                        .receiptNumber(rcptNum)
                        .build());
            }
        }

        entries.sort(Comparator.comparing(RentLedgerEntryResponse::getPaymentDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return entries;
    }

    @Transactional(readOnly = true)
    public byte[] generateInvoicePdfBytes(UUID invoiceId, UUID userId, Role role) {
        RentInvoice invoice = invoiceService.findScopedInvoiceEntity(invoiceId, userId, role);
        List<InvoiceItemResponse> items = invoiceService.getInvoiceItems(invoice.getId());
        OwnerProfile ownerProfile = ownerProfileRepository.findByUserId(invoice.getOwnerId()).orElse(null);
        Property property = propertyRepository.findById(invoice.getPropertyId()).orElse(null);
        Booking booking = bookingRepository.findById(invoice.getBookingId()).orElse(null);
        Room room = booking != null ? roomRepository.findById(booking.getRoomId()).orElse(null) : null;
        Bed bed = booking != null ? bedRepository.findById(booking.getBedId()).orElse(null) : null;
        User resident = userRepository.findById(invoice.getResidentId()).orElse(null);

        String bankSummary = ownerProfile != null && ownerProfile.getBankAccountNumber() != null
                ? (safeText(ownerProfile.getBankName(), "Bank") + " A/C " + ownerProfile.getBankAccountNumber()
                + " IFSC " + safeText(ownerProfile.getBankIfscCode(), "-"))
                : "Direct UPI / Bank Transfer";

        return pdfDocumentService.generateInvoicePdf(
                invoice,
                items,
                ownerProfile != null ? ownerProfile.getBusinessName() : "PG Management",
                ownerProfile != null ? ownerProfile.getUpiId() : null,
                bankSummary,
                property != null ? property.getName() : "PG Property",
                room != null ? room.getFloorNumber() : 0,
                room != null ? room.getRoomNumber() : "-",
                bed != null ? bed.getBedCode() : "-",
                resident != null ? resident.getFullName() : "Resident",
                resident != null ? resident.getPhone() : "-"
        );
    }

    @Transactional(readOnly = true)
    public byte[] generatePaymentReceiptPdfBytes(UUID paymentId, UUID userId, Role role) {
        PaymentReceiptResponse receipt = paymentService.getPaymentReceipt(paymentId, userId, role);
        RentInvoice invoice = invoiceRepository.findById(receipt.getInvoiceId()).orElse(null);
        Booking booking = invoice != null ? bookingRepository.findById(invoice.getBookingId()).orElse(null) : null;
        Room room = booking != null ? roomRepository.findById(booking.getRoomId()).orElse(null) : null;
        PaymentConfirmation conf = confirmationRepository.findByPaymentId(paymentId).orElse(null);

        long remainingPaise = invoice != null
                ? Math.max(0L, resolveInvoiceTotalPaise(invoice) - resolveInvoicePaidPaise(invoice))
                : 0L;

        return pdfDocumentService.generateReceiptPdf(
                receipt,
                room != null ? room.getFloorNumber() : 0,
                receipt.getBillingMonth() != null ? MONTH_LABEL.format(receipt.getBillingMonth()) : "-",
                MoneyUtils.toRupees(remainingPaise).toPlainString(),
                conf != null ? conf.getVerificationSource() : "OWNER_RECORDED_VERIFIED"
        );
    }

    @Transactional(readOnly = true)
    public byte[] generateSubmissionReceiptPdfBytes(UUID submissionId, UUID userId, Role role) {
        PaymentSubmission submission = findScopedSubmission(submissionId, userId, role);
        if (submission.getStatus() != PaymentSubmissionStatus.CONFIRMED) {
            throw new BadRequestException("Official paid receipt is not available until payment verification is CONFIRMED");
        }
        PaymentConfirmation conf = confirmationRepository.findBySubmissionId(submission.getId())
                .orElseThrow(() -> new BadRequestException("Verification confirmation record not found"));
        if (conf.getPaymentId() == null) {
            throw new BadRequestException("Linked verified payment record not found");
        }
        return generatePaymentReceiptPdfBytes(conf.getPaymentId(), userId, role);
    }

    private PaymentSubmission findScopedSubmission(UUID submissionId, UUID userId, Role role) {
        return role == Role.OWNER
                ? submissionRepository.findByIdAndOwnerId(submissionId, userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Payment submission not found for this owner"))
                : submissionRepository.findByIdAndResidentId(submissionId, userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Payment submission not found for this resident"));
    }

    private List<PaymentSubmissionResponse> filterAndMapSubmissions(
            List<PaymentSubmission> raw,
            UUID propertyId,
            Integer floorNumber,
            String roomNumber,
            UUID residentId,
            String billingMonth,
            PaymentSubmissionStatus status,
            String search) {
        if (raw.isEmpty()) {
            return List.of();
        }
        Map<UUID, RentInvoice> invoiceMap = new HashMap<>();
        invoiceRepository.findAllById(raw.stream().map(PaymentSubmission::getInvoiceId).distinct().toList())
                .forEach(i -> invoiceMap.put(i.getId(), i));

        Map<UUID, Property> propertyMap = new HashMap<>();
        propertyRepository.findAllById(raw.stream().map(PaymentSubmission::getPropertyId).distinct().toList())
                .forEach(p -> propertyMap.put(p.getId(), p));

        Map<UUID, User> residentMap = new HashMap<>();
        userRepository.findAllById(raw.stream().map(PaymentSubmission::getResidentId).distinct().toList())
                .forEach(u -> residentMap.put(u.getId(), u));

        Map<UUID, PaymentConfirmation> confMap = new HashMap<>();
        confirmationRepository.findAllBySubmissionIdIn(raw.stream().map(PaymentSubmission::getId).toList())
                .forEach(c -> confMap.put(c.getSubmissionId(), c));

        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        return raw.stream()
                .filter(s -> propertyId == null || s.getPropertyId().equals(propertyId))
                .filter(s -> floorNumber == null || s.getFloorNumber() == floorNumber)
                .filter(s -> roomNumber == null || roomNumber.isBlank()
                        || (s.getRoomNumber() != null && s.getRoomNumber().equalsIgnoreCase(roomNumber.trim())))
                .filter(s -> residentId == null || s.getResidentId().equals(residentId))
                .filter(s -> status == null || s.getStatus() == status)
                .filter(s -> {
                    if (billingMonth == null || billingMonth.isBlank()) return true;
                    RentInvoice inv = invoiceMap.get(s.getInvoiceId());
                    return inv != null && inv.getBillingMonth() != null
                            && inv.getBillingMonth().toString().startsWith(billingMonth.trim());
                })
                .filter(s -> {
                    if (normalizedSearch.isEmpty()) return true;
                    RentInvoice inv = invoiceMap.get(s.getInvoiceId());
                    Property prop = propertyMap.get(s.getPropertyId());
                    User res = residentMap.get(s.getResidentId());
                    return s.getUtrReference().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                            || (s.getRoomNumber() != null && s.getRoomNumber().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                            || (inv != null && inv.getInvoiceNumber().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                            || (prop != null && prop.getName().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                            || (res != null && res.getFullName().toLowerCase(Locale.ROOT).contains(normalizedSearch));
                })
                .map(s -> toResponse(
                        s,
                        invoiceMap.get(s.getInvoiceId()),
                        propertyMap.get(s.getPropertyId()),
                        residentMap.get(s.getResidentId()),
                        confMap.get(s.getId())
                ))
                .toList();
    }

    private PaymentSubmissionResponse mapSubmission(PaymentSubmission s) {
        RentInvoice inv = invoiceRepository.findById(s.getInvoiceId()).orElse(null);
        Property prop = propertyRepository.findById(s.getPropertyId()).orElse(null);
        User res = userRepository.findById(s.getResidentId()).orElse(null);
        PaymentConfirmation conf = confirmationRepository.findBySubmissionId(s.getId()).orElse(null);
        return toResponse(s, inv, prop, res, conf);
    }

    private PaymentSubmissionResponse toResponse(
            PaymentSubmission s,
            RentInvoice inv,
            Property prop,
            User res,
            PaymentConfirmation conf) {
        long remainingPaise = inv != null
                ? Math.max(0L, resolveInvoiceTotalPaise(inv) - resolveInvoicePaidPaise(inv))
                : 0L;
        return PaymentSubmissionResponse.builder()
                .id(s.getId())
                .ownerId(s.getOwnerId())
                .propertyId(s.getPropertyId())
                .propertyName(prop != null ? prop.getName() : "PG Property")
                .floorNumber(s.getFloorNumber())
                .roomNumber(s.getRoomNumber())
                .residentId(s.getResidentId())
                .residentName(res != null ? res.getFullName() : "Resident")
                .invoiceId(s.getInvoiceId())
                .invoiceNumber(inv != null ? inv.getInvoiceNumber() : "-")
                .billingMonth(inv != null ? inv.getBillingMonth() : null)
                .idempotencyKey(s.getIdempotencyKey())
                .paymentMethod(s.getPaymentMethod())
                .amountPaise(s.getAmountPaise())
                .amount(MoneyUtils.toRupees(s.getAmountPaise()))
                .currency(s.getCurrency())
                .utrReference(s.getUtrReference())
                .payerUpiId(s.getPayerUpiId())
                .payerName(s.getPayerName())
                .bankName(s.getBankName())
                .paymentDate(s.getPaymentDate())
                .notes(s.getNotes())
                .status(s.getStatus())
                .rejectionReason(s.getRejectionReason())
                .submittedAt(s.getSubmittedAt())
                .verifiedAt(conf != null ? conf.getDecidedAt() : null)
                .receiptNumber(conf != null ? conf.getReceiptNumber() : null)
                .paymentId(conf != null ? conf.getPaymentId() : null)
                .remainingBalancePaise(remainingPaise)
                .remainingBalance(MoneyUtils.toRupees(remainingPaise))
                .ownerRemarks(conf != null ? conf.getRemarks() : null)
                .verificationSource(conf != null ? conf.getVerificationSource() : "AWAITING_OWNER_OR_BANK_VERIFICATION")
                .build();
    }

    private String buildUpiDeepLink(
            String upiId, String payeeName, BigDecimal amount, String invoiceNumber, String propertyName) {
        if (upiId == null || upiId.isBlank()) {
            return null;
        }
        String note = "Rent " + invoiceNumber + " " + safeText(propertyName, "PG");
        return "upi://pay?pa=" + urlEnc(upiId.trim())
                + "&pn=" + urlEnc(safeText(payeeName, "PG Owner"))
                + "&am=" + amount.toPlainString()
                + "&cu=INR"
                + "&tn=" + urlEnc(note)
                + "&tr=" + urlEnc(invoiceNumber);
    }

    private String urlEnc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private long resolveInvoiceBasePaise(RentInvoice inv) {
        return inv.getBaseRentPaise() > 0 || inv.getBaseRent() == null
                ? inv.getBaseRentPaise()
                : MoneyUtils.toPaise(inv.getBaseRent());
    }

    private long resolveInvoiceAddPaise(RentInvoice inv) {
        return inv.getAdditionalChargesPaise() > 0 || inv.getUtilityCharges() == null
                ? inv.getAdditionalChargesPaise()
                : MoneyUtils.toPaise(inv.getUtilityCharges());
    }

    private long resolveInvoicePenaltyPaise(RentInvoice inv) {
        return inv.getPenaltyFeePaise() > 0 || inv.getPenaltyFee() == null
                ? inv.getPenaltyFeePaise()
                : MoneyUtils.toPaise(inv.getPenaltyFee());
    }

    private long resolveInvoiceTotalPaise(RentInvoice inv) {
        return inv.getTotalAmountPaise() > 0 || inv.getTotalAmount() == null
                ? inv.getTotalAmountPaise()
                : MoneyUtils.toPaise(inv.getTotalAmount());
    }

    private long resolveInvoicePaidPaise(RentInvoice inv) {
        return inv.getPaidAmountPaise() > 0 || inv.getPaidAmount() == null
                ? inv.getPaidAmountPaise()
                : MoneyUtils.toPaise(inv.getPaidAmount());
    }

    private String trimOrNull(String val) {
        return (val == null || val.isBlank()) ? null : val.trim();
    }

    private String safeText(String val, String fallback) {
        return (val == null || val.isBlank()) ? fallback : val.trim();
    }
}
