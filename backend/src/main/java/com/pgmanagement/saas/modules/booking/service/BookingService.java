package com.pgmanagement.saas.modules.booking.service;

import com.pgmanagement.saas.modules.booking.dto.request.CheckoutRequest;
import com.pgmanagement.saas.modules.booking.dto.request.CreateBookingRequest;
import com.pgmanagement.saas.modules.booking.dto.request.GiveNoticeRequest;
import com.pgmanagement.saas.modules.booking.dto.request.ProposeRentRevisionRequest;
import com.pgmanagement.saas.modules.booking.dto.request.RespondRentRevisionRequest;
import com.pgmanagement.saas.modules.booking.dto.request.UpdateBookingRentRequest;
import com.pgmanagement.saas.modules.booking.dto.response.BookingResponse;
import com.pgmanagement.saas.modules.booking.dto.response.RentRevisionResponse;
import com.pgmanagement.saas.modules.booking.entity.Booking;
import com.pgmanagement.saas.modules.booking.entity.BookingStatus;
import com.pgmanagement.saas.modules.booking.entity.DepositStatus;
import com.pgmanagement.saas.modules.booking.entity.RentRevisionAgreement;
import com.pgmanagement.saas.modules.booking.entity.RentRevisionStatus;
import com.pgmanagement.saas.modules.booking.entity.ResidentAssignment;
import com.pgmanagement.saas.modules.booking.repository.BookingRepository;
import com.pgmanagement.saas.modules.booking.repository.RentRevisionAgreementRepository;
import com.pgmanagement.saas.modules.booking.repository.ResidentAssignmentRepository;
import com.pgmanagement.saas.modules.notification.entity.NotificationType;
import com.pgmanagement.saas.modules.notification.service.NotificationService;
import com.pgmanagement.saas.shared.util.MoneyUtils;
import com.pgmanagement.saas.modules.owner.entity.OwnerProfile;
import com.pgmanagement.saas.modules.owner.repository.OwnerProfileRepository;
import com.pgmanagement.saas.modules.property.entity.Property;
import com.pgmanagement.saas.modules.property.service.PropertyService;
import com.pgmanagement.saas.modules.resident.dto.response.ResidentAssignedRoomResponse;
import com.pgmanagement.saas.modules.resident.service.ResidentService;
import com.pgmanagement.saas.modules.room.entity.Bed;
import com.pgmanagement.saas.modules.room.entity.Room;
import com.pgmanagement.saas.modules.room.service.RoomService;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.modules.users.entity.User;
import com.pgmanagement.saas.modules.users.repository.UserRepository;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.exception.BadRequestException;
import com.pgmanagement.saas.shared.exception.ConflictException;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final List<BookingStatus> OPEN_STATUSES = List.of(BookingStatus.ACTIVE, BookingStatus.NOTICE_GIVEN);
    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    private final BookingRepository bookingRepository;
    private final ResidentAssignmentRepository residentAssignmentRepository;
    private final RentRevisionAgreementRepository rentRevisionAgreementRepository;
    private final RoomService roomService;
    private final PropertyService propertyService;
    private final ResidentService residentService;
    private final OwnerProfileRepository ownerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public BookingResponse createBooking(UUID ownerId, CreateBookingRequest request) {
        residentService.validateAndAssignResidentToOwner(request.getResidentId(), ownerId);

        if (bookingRepository.existsByResidentIdAndStatusIn(request.getResidentId(), OPEN_STATUSES)) {
            throw new ConflictException("Resident already has an active bed assignment");
        }
        if (bookingRepository.existsByBedIdAndStatusIn(request.getBedId(), OPEN_STATUSES)) {
            throw new ConflictException("Bed is already allocated to another open booking");
        }

        Bed allocatedBed = roomService.allocateVacantBed(request.getBedId(), ownerId);

        Booking booking = Booking.builder()
                .ownerId(ownerId)
                .propertyId(allocatedBed.getPropertyId())
                .roomId(allocatedBed.getRoomId())
                .bedId(allocatedBed.getId())
                .residentId(request.getResidentId())
                .checkInDate(request.getCheckInDate())
                .agreedMonthlyRent(request.getAgreedMonthlyRent())
                .securityDepositAmount(request.getSecurityDepositAmount() != null
                        ? request.getSecurityDepositAmount()
                        : BigDecimal.ZERO)
                .depositStatus(request.getDepositStatus() != null
                        ? request.getDepositStatus()
                        : DepositStatus.PENDING)
                .status(BookingStatus.ACTIVE)
                .notes(request.getNotes())
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        syncResidentAssignment(savedBooking);

        return BookingResponse.from(savedBooking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listBookings(UUID userId, Role role) {
        List<Booking> bookings = role == Role.OWNER
                ? bookingRepository.findAllByOwnerId(userId)
                : bookingRepository.findAllByResidentId(userId);
        return bookings.stream().map(BookingResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<BookingResponse> searchBookings(
            UUID userId,
            Role role,
            BookingStatus status,
            UUID propertyId,
            String search,
            int page,
            int size) {
        List<Booking> bookings = role == Role.OWNER
                ? bookingRepository.findAllByOwnerId(userId)
                : bookingRepository.findAllByResidentId(userId);

        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<BookingResponse> filtered = bookings.stream()
                .filter(b -> status == null || b.getStatus() == status)
                .filter(b -> propertyId == null || b.getPropertyId().equals(propertyId))
                .filter(b -> normalizedSearch.isEmpty()
                        || (b.getNotes() != null && b.getNotes().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                        || b.getStatus().name().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                .sorted(Comparator.comparing(Booking::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(BookingResponse::from)
                .toList();

        return PagedResponse.ofList(filtered, page, size);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBooking(UUID bookingId, UUID userId, Role role) {
        return BookingResponse.from(findScopedBooking(bookingId, userId, role));
    }

    @Transactional
    public BookingResponse updateAgreedRent(UUID bookingId, UUID ownerId, UpdateBookingRentRequest request) {
        Booking booking = findOwnedBookingEntity(bookingId, ownerId);
        if (booking.getStatus() == BookingStatus.CHECKED_OUT || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot modify rent for a closed booking");
        }
        booking.setAgreedMonthlyRent(request.getAgreedMonthlyRent());
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            booking.setNotes(request.getNotes().trim());
        }
        Booking savedBooking = bookingRepository.save(booking);
        syncResidentAssignment(savedBooking);

        return BookingResponse.from(savedBooking);
    }

    @Transactional
    public BookingResponse giveNotice(UUID bookingId, UUID userId, Role role, GiveNoticeRequest request) {
        Booking booking = findScopedBooking(bookingId, userId, role);
        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw new BadRequestException("Notice can only be submitted for an ACTIVE booking");
        }
        booking.setStatus(BookingStatus.NOTICE_GIVEN);
        booking.setExpectedCheckOutDate(request.getExpectedCheckOutDate());
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            booking.setNotes(request.getNotes().trim());
        }
        Booking savedBooking = bookingRepository.save(booking);
        syncResidentAssignment(savedBooking);

        return BookingResponse.from(savedBooking);
    }

    @Transactional
    public BookingResponse checkout(UUID bookingId, UUID ownerId, CheckoutRequest request) {
        Booking booking = findOwnedBookingEntity(bookingId, ownerId);
        if (booking.getStatus() != BookingStatus.ACTIVE && booking.getStatus() != BookingStatus.NOTICE_GIVEN) {
            throw new BadRequestException("Only ACTIVE or NOTICE_GIVEN bookings can be checked out");
        }

        LocalDate checkOutDate = (request != null && request.getActualCheckOutDate() != null)
                ? request.getActualCheckOutDate()
                : LocalDate.now();
        booking.setActualCheckOutDate(checkOutDate);
        booking.setStatus(BookingStatus.CHECKED_OUT);
        if (request != null && request.getDepositStatus() != null) {
            booking.setDepositStatus(request.getDepositStatus());
        }
        if (request != null && request.getNotes() != null && !request.getNotes().isBlank()) {
            booking.setNotes(request.getNotes().trim());
        }

        roomService.releaseBed(booking.getBedId(), ownerId);
        Booking savedBooking = bookingRepository.save(booking);
        syncResidentAssignment(savedBooking);

        return BookingResponse.from(savedBooking);
    }

    @Transactional(readOnly = true)
    public ResidentAssignedRoomResponse getAssignedRoomForResident(UUID residentUserId) {
        return findAssignedRoomOptional(residentUserId).orElse(null);
    }

    @Transactional(readOnly = true)
    public Optional<ResidentAssignedRoomResponse> findAssignedRoomOptional(UUID residentUserId) {
        Optional<Booking> activeOpt = findOptionalActiveResidentBooking(residentUserId);
        if (activeOpt.isEmpty()) {
            return Optional.empty();
        }
        Booking activeBooking = activeOpt.get();
        Property property = propertyService.findEntityForRead(activeBooking.getPropertyId());
        Room room = roomService.findRoomEntityForRead(activeBooking.getRoomId());
        Bed bed = roomService.findBedEntityForRead(activeBooking.getBedId());
        OwnerProfile ownerProfile = ownerProfileRepository.findByUserId(activeBooking.getOwnerId()).orElse(null);
        User ownerUser = userRepository.findById(activeBooking.getOwnerId()).orElse(null);

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

        LocalDate today = LocalDate.now(INDIA_ZONE);
        int billingDay = property.getDefaultBillingDay() > 0 ? property.getDefaultBillingDay() : 5;
        LocalDate candidateDue = today.withDayOfMonth(Math.min(billingDay, today.lengthOfMonth()));
        if (candidateDue.isBefore(today)) {
            LocalDate nextMonth = today.plusMonths(1);
            candidateDue = nextMonth.withDayOfMonth(Math.min(billingDay, nextMonth.lengthOfMonth()));
        }

        return Optional.of(ResidentAssignedRoomResponse.builder()
                .bookingId(activeBooking.getId())
                .propertyId(property.getId())
                .propertyName(property.getName())
                .propertyAddress(formattedAddress)
                .propertyEmergencyContact(property.getEmergencyContact())
                .propertyAmenities(property.getAmenities())
                .defaultBillingDay(property.getDefaultBillingDay())
                .gracePeriodDays(property.getGracePeriodDays())
                .lateFeeAmount(property.getLateFeeAmount())
                .ownerBusinessName(ownerProfile != null && ownerProfile.getBusinessName() != null
                        ? ownerProfile.getBusinessName()
                        : (ownerUser != null ? ownerUser.getFullName() : "PG Management"))
                .ownerPhone(ownerUser != null ? ownerUser.getPhone() : property.getEmergencyContact())
                .roomId(room.getId())
                .roomNumber(room.getRoomNumber())
                .floorNumber(room.getFloorNumber())
                .roomType(room.getSharingType().name())
                .hasAttachedBathroom(room.isHasAttachedBathroom())
                .hasBalcony(room.isHasBalcony())
                .bedId(bed.getId())
                .bedNumber(bed.getBedCode())
                .bookingStatus(activeBooking.getStatus())
                .checkInDate(activeBooking.getCheckInDate())
                .expectedCheckOutDate(activeBooking.getExpectedCheckOutDate())
                .nextDueDate(candidateDue)
                .agreedMonthlyRent(activeBooking.getAgreedMonthlyRent())
                .securityDepositAmount(activeBooking.getSecurityDepositAmount())
                .build());
    }

    @Transactional(readOnly = true)
    public Optional<Booking> findOptionalActiveResidentBooking(UUID residentId) {
        return bookingRepository.findFirstByResidentIdAndStatusInOrderByCreatedAtDesc(residentId, OPEN_STATUSES);
    }

    @Transactional(readOnly = true)
    public List<Booking> findOpenBookingsForOwner(UUID ownerId, UUID propertyId) {
        return bookingRepository.findAllByOwnerIdAndStatusIn(ownerId, OPEN_STATUSES)
                .stream()
                .filter(b -> propertyId == null || b.getPropertyId().equals(propertyId))
                .toList();
    }

    @Transactional(readOnly = true)
    public Booking findOwnedBookingEntity(UUID bookingId, UUID ownerId) {
        return bookingRepository.findByIdAndOwnerId(bookingId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found for this owner"));
    }

    @Transactional(readOnly = true)
    public Booking findActiveResidentBooking(UUID residentId) {
        return bookingRepository.findFirstByResidentIdAndStatusInOrderByCreatedAtDesc(residentId, OPEN_STATUSES)
                .orElseThrow(() -> new ResourceNotFoundException("No active PG booking found for resident"));
    }

    private void syncResidentAssignment(Booking booking) {
        ResidentAssignment assignment = residentAssignmentRepository.findByBookingId(booking.getId())
                .orElseGet(() -> ResidentAssignment.builder()
                        .id(booking.getId())
                        .bookingId(booking.getId())
                        .ownerId(booking.getOwnerId())
                        .propertyId(booking.getPropertyId())
                        .roomId(booking.getRoomId())
                        .bedId(booking.getBedId())
                        .residentId(booking.getResidentId())
                        .agreementEffectiveDate(booking.getCheckInDate())
                        .build());
        assignment.setAgreedMonthlyRentPaise(MoneyUtils.toPaise(booking.getAgreedMonthlyRent()));
        assignment.setSecurityDepositPaise(MoneyUtils.toPaise(booking.getSecurityDepositAmount()));
        assignment.setStatus(booking.getStatus());
        assignment.setNotes(booking.getNotes());
        residentAssignmentRepository.save(assignment);
    }

    @Transactional
    public RentRevisionResponse proposeRentRevision(
            UUID bookingId, UUID ownerId, ProposeRentRevisionRequest request) {
        Booking booking = findOwnedBookingEntity(bookingId, ownerId);
        if (booking.getStatus() == BookingStatus.CHECKED_OUT || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot propose a rent revision for a closed booking");
        }
        syncResidentAssignment(booking);
        ResidentAssignment assignment = residentAssignmentRepository.findByBookingId(booking.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Resident assignment not found"));
        long proposedPaise = MoneyUtils.toPaise(request.getProposedMonthlyRent());

        RentRevisionAgreement saved = rentRevisionAgreementRepository.save(RentRevisionAgreement.builder()
                .assignmentId(assignment.getId())
                .bookingId(booking.getId())
                .ownerId(ownerId)
                .residentId(booking.getResidentId())
                .previousRentPaise(assignment.getAgreedMonthlyRentPaise())
                .proposedRentPaise(proposedPaise)
                .effectiveDate(request.getEffectiveDate())
                .reason(request.getReason())
                .status(RentRevisionStatus.PENDING_RESIDENT_ACCEPTANCE)
                .proposedAt(java.time.Instant.now())
                .build());

        notificationService.createNotification(
                booking.getResidentId(),
                ownerId,
                "Monthly Rent Revision Proposal",
                "Owner proposed updating monthly rent from "
                        + MoneyUtils.formatInrFromPaise(assignment.getAgreedMonthlyRentPaise())
                        + " to " + MoneyUtils.formatInrFromPaise(proposedPaise)
                        + " effective " + request.getEffectiveDate() + ". Please review and respond.",
                NotificationType.RENT_REVISION,
                saved.getId()
        );

        return RentRevisionResponse.from(saved);
    }

    @Transactional
    public RentRevisionResponse respondToRentRevision(
            UUID revisionId, UUID residentId, RespondRentRevisionRequest request) {
        RentRevisionAgreement revision = rentRevisionAgreementRepository.findByIdAndResidentId(revisionId, residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Rent revision proposal not found for this resident"));
        if (revision.getStatus() != RentRevisionStatus.PENDING_RESIDENT_ACCEPTANCE) {
            throw new BadRequestException("This rent revision proposal has already been responded to");
        }

        revision.setStatus(request.isAccept() ? RentRevisionStatus.ACCEPTED : RentRevisionStatus.REJECTED);
        revision.setRespondedAt(java.time.Instant.now());
        if (request.getRemarks() != null && !request.getRemarks().isBlank()) {
            revision.setResidentRemarks(request.getRemarks().trim());
        }
        RentRevisionAgreement saved = rentRevisionAgreementRepository.save(revision);

        LocalDate today = LocalDate.now(INDIA_ZONE);
        if (request.isAccept() && !saved.getEffectiveDate().isAfter(today)) {
            bookingRepository.findById(saved.getBookingId()).ifPresent(booking -> {
                booking.setAgreedMonthlyRent(MoneyUtils.toRupees(saved.getProposedRentPaise()));
                bookingRepository.save(booking);
                syncResidentAssignment(booking);
            });
        }

        String statusLabel = request.isAccept() ? "ACCEPTED" : "REJECTED";
        notificationService.createNotification(
                saved.getOwnerId(),
                saved.getOwnerId(),
                "Rent Revision " + statusLabel,
                "Resident " + statusLabel.toLowerCase(Locale.ROOT) + " rent revision to "
                        + MoneyUtils.formatInrFromPaise(saved.getProposedRentPaise())
                        + " effective " + saved.getEffectiveDate(),
                NotificationType.RENT_REVISION,
                saved.getId()
        );

        return RentRevisionResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<RentRevisionResponse> listRentRevisions(UUID userId, Role role) {
        List<RentRevisionAgreement> items = role == Role.OWNER
                ? rentRevisionAgreementRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)
                : rentRevisionAgreementRepository.findAllByResidentIdOrderByCreatedAtDesc(userId);
        return items.stream().map(RentRevisionResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long resolveEffectiveAgreedRentPaise(Booking booking, LocalDate billingMonth) {
        LocalDate normalizedMonth = billingMonth != null
                ? billingMonth.withDayOfMonth(1)
                : LocalDate.now(INDIA_ZONE).withDayOfMonth(1);
        long resolvedPaise = residentAssignmentRepository.findByBookingId(booking.getId())
                .map(ResidentAssignment::getAgreedMonthlyRentPaise)
                .orElseGet(() -> MoneyUtils.toPaise(booking.getAgreedMonthlyRent()));

        List<RentRevisionAgreement> accepted = rentRevisionAgreementRepository
                .findAllByBookingIdAndStatusOrderByEffectiveDateAsc(booking.getId(), RentRevisionStatus.ACCEPTED);
        for (RentRevisionAgreement revision : accepted) {
            if (!normalizedMonth.isBefore(revision.getEffectiveDate().withDayOfMonth(1))) {
                resolvedPaise = revision.getProposedRentPaise();
            }
        }
        return resolvedPaise;
    }

    private Booking findScopedBooking(UUID bookingId, UUID userId, Role role) {
        if (role == Role.OWNER) {
            return findOwnedBookingEntity(bookingId, userId);
        }
        return bookingRepository.findByIdAndResidentId(bookingId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found for this resident"));
    }
}
