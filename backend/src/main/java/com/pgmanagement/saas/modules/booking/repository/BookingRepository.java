package com.pgmanagement.saas.modules.booking.repository;

import com.pgmanagement.saas.modules.booking.entity.Booking;
import com.pgmanagement.saas.modules.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findAllByOwnerId(UUID ownerId);

    List<Booking> findAllByOwnerIdAndStatusIn(UUID ownerId, Collection<BookingStatus> statuses);

    List<Booking> findAllByResidentId(UUID residentId);

    Optional<Booking> findByIdAndOwnerId(UUID id, UUID ownerId);

    Optional<Booking> findByIdAndResidentId(UUID id, UUID residentId);

    Optional<Booking> findFirstByResidentIdAndStatusInOrderByCreatedAtDesc(
            UUID residentId, Collection<BookingStatus> statuses);

    boolean existsByResidentIdAndStatusIn(UUID residentId, Collection<BookingStatus> statuses);

    boolean existsByBedIdAndStatusIn(UUID bedId, Collection<BookingStatus> statuses);

    boolean existsByBedId(UUID bedId);
}
