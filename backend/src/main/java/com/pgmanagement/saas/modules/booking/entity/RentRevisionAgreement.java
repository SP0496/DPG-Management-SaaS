package com.pgmanagement.saas.modules.booking.entity;

import com.pgmanagement.saas.shared.entity.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "rent_revision_agreements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentRevisionAgreement extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "resident_id", nullable = false)
    private UUID residentId;

    @Column(name = "previous_rent_paise", nullable = false)
    private long previousRentPaise;

    @Column(name = "proposed_rent_paise", nullable = false)
    private long proposedRentPaise;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private RentRevisionStatus status = RentRevisionStatus.PENDING_RESIDENT_ACCEPTANCE;

    @Column(name = "proposed_at", nullable = false)
    private Instant proposedAt;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Column(name = "resident_remarks", columnDefinition = "TEXT")
    private String residentRemarks;
}
