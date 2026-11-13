package com.pgmanagement.saas.modules.booking.repository;

import com.pgmanagement.saas.modules.booking.entity.RentRevisionAgreement;
import com.pgmanagement.saas.modules.booking.entity.RentRevisionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RentRevisionAgreementRepository extends JpaRepository<RentRevisionAgreement, UUID> {

    List<RentRevisionAgreement> findAllByBookingIdOrderByEffectiveDateDescCreatedAtDesc(UUID bookingId);

    List<RentRevisionAgreement> findAllByResidentIdOrderByCreatedAtDesc(UUID residentId);

    List<RentRevisionAgreement> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    Optional<RentRevisionAgreement> findByIdAndResidentId(UUID id, UUID residentId);

    List<RentRevisionAgreement> findAllByBookingIdAndStatusOrderByEffectiveDateAsc(
            UUID bookingId, RentRevisionStatus status);
}
