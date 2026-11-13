package com.pgmanagement.saas.modules.property.entity;

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
import java.util.UUID;

@Entity
@Table(name = "properties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_type", nullable = false, length = 40)
    private PropertyType propertyType;

    @Column(name = "address_line1", nullable = false, length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(name = "postal_code", nullable = false, length = 20)
    private String postalCode;

    @Column(name = "emergency_contact", nullable = false, length = 20)
    private String emergencyContact;

    @Builder.Default
    @Column(name = "default_billing_day", nullable = false)
    private int defaultBillingDay = 1;

    @Builder.Default
    @Column(name = "grace_period_days", nullable = false)
    private int gracePeriodDays = 5;

    @Builder.Default
    @Column(name = "late_fee_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal lateFeeAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String amenities;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
