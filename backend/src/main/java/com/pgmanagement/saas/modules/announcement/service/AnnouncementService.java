package com.pgmanagement.saas.modules.announcement.service;

import com.pgmanagement.saas.modules.announcement.dto.request.CreateAnnouncementRequest;
import com.pgmanagement.saas.modules.announcement.dto.response.AnnouncementResponse;
import com.pgmanagement.saas.modules.announcement.entity.Announcement;
import com.pgmanagement.saas.modules.announcement.entity.AnnouncementPriority;
import com.pgmanagement.saas.modules.announcement.repository.AnnouncementRepository;
import com.pgmanagement.saas.modules.booking.entity.Booking;
import com.pgmanagement.saas.modules.booking.service.BookingService;
import com.pgmanagement.saas.modules.property.service.PropertyService;
import com.pgmanagement.saas.modules.resident.service.ResidentService;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final PropertyService propertyService;
    private final BookingService bookingService;
    private final ResidentService residentService;

    @Transactional
    public AnnouncementResponse createAnnouncement(UUID ownerId, CreateAnnouncementRequest request) {
        if (request.getPropertyId() != null) {
            propertyService.assertActivePropertyOwnedBy(request.getPropertyId(), ownerId);
        }

        Announcement announcement = Announcement.builder()
                .ownerId(ownerId)
                .propertyId(request.getPropertyId())
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .priority(request.getPriority() != null ? request.getPriority() : AnnouncementPriority.NORMAL)
                .active(true)
                .expiresAt(request.getExpiresAt())
                .build();

        return AnnouncementResponse.from(announcementRepository.save(announcement));
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> listAnnouncements(UUID userId, Role role) {
        if (role == Role.OWNER) {
            return announcementRepository.findAllByOwnerIdAndActiveTrueOrderByCreatedAtDesc(userId)
                    .stream()
                    .map(AnnouncementResponse::from)
                    .toList();
        }
        Optional<Booking> activeBooking = bookingService.findOptionalActiveResidentBooking(userId);
        if (activeBooking.isPresent()) {
            Booking booking = activeBooking.get();
            return announcementRepository
                    .findActiveForResidentProperty(booking.getOwnerId(), booking.getPropertyId())
                    .stream()
                    .map(AnnouncementResponse::from)
                    .toList();
        }
        Optional<UUID> linkedOwner = residentService.findOwnerIdForResident(userId);
        if (linkedOwner.isEmpty()) {
            return List.of();
        }
        Instant now = Instant.now();
        return announcementRepository.findAllByOwnerIdAndActiveTrueOrderByCreatedAtDesc(linkedOwner.get())
                .stream()
                .filter(a -> a.getPropertyId() == null)
                .filter(a -> a.getExpiresAt() == null || a.getExpiresAt().isAfter(now))
                .map(AnnouncementResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<AnnouncementResponse> searchAnnouncements(
            UUID userId, Role role, UUID propertyId, String search, int page, int size) {
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<AnnouncementResponse> filtered = listAnnouncements(userId, role)
                .stream()
                .filter(a -> propertyId == null || (a.getPropertyId() != null && a.getPropertyId().equals(propertyId)))
                .filter(a -> normalizedSearch.isEmpty()
                        || a.getTitle().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                        || a.getContent().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                .toList();
        return PagedResponse.ofList(filtered, page, size);
    }

    @Transactional
    public void deactivateAnnouncement(UUID announcementId, UUID ownerId) {
        Announcement announcement = announcementRepository.findByIdAndOwnerId(announcementId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found for this owner"));
        announcement.setActive(false);
        announcementRepository.save(announcement);
    }
}
