package com.pgmanagement.saas.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenant_stays")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantStay {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_id", nullable = false)
    private Bed bed;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "expected_check_out_date")
    private LocalDate expectedCheckOutDate;

    @Column(name = "actual_check_out_date")
    private LocalDate actualCheckOutDate;

    @Column(name = "agreed_monthly_rent", nullable = false, precision = 10, scale = 2)
    private BigDecimal agreedMonthlyRent;

    @Column(name = "security_deposit_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal securityDepositAmount;

    @Column(name = "deposit_status", nullable = false, length = 50)
    @Builder.Default
    private String depositStatus = "PENDING"; // PENDING, PAID, REFUNDED

    @Column(name = "stay_status", nullable = false, length = 50)
    @Builder.Default
    private String stayStatus = "ACTIVE"; // ACTIVE, NOTICE_GIVEN, CHECKED_OUT

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
