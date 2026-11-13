package com.pgmanagement.saas.modules.booking.entity;

import com.pgmanagement.saas.shared.entity.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "resident_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResidentAssignment extends BaseAuditEntity {

    @Id
    private UUID id;

    @Column(name = "booking_id", nullable = false, unique = true)
    private UUID bookingId;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "bed_id", nullable = false)
    private UUID bedId;

    @Column(name = "resident_id", nullable = false)
    private UUID residentId;

    @Column(name = "agreed_monthly_rent_paise", nullable = false)
    private long agreedMonthlyRentPaise;

    @Column(name = "security_deposit_paise", nullable = false)
    private long securityDepositPaise;

    @Column(name = "agreement_effective_date", nullable = false)
    private LocalDate agreementEffectiveDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
