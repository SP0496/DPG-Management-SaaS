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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

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

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "expected_check_out_date")
    private LocalDate expectedCheckOutDate;

    @Column(name = "actual_check_out_date")
    private LocalDate actualCheckOutDate;

    @Column(name = "agreed_monthly_rent", nullable = false, precision = 12, scale = 2)
    private BigDecimal agreedMonthlyRent;

    @Builder.Default
    @Column(name = "security_deposit_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal securityDepositAmount = BigDecimal.ZERO;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "deposit_status", nullable = false, length = 30)
    private DepositStatus depositStatus = DepositStatus.PENDING;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingStatus status = BookingStatus.ACTIVE;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
