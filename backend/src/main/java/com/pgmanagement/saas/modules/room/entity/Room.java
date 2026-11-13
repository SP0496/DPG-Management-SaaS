package com.pgmanagement.saas.modules.room.entity;

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
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "room_number", nullable = false, length = 50)
    private String roomNumber;

    @Builder.Default
    @Column(name = "floor_number", nullable = false)
    private int floorNumber = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "sharing_type", nullable = false, length = 30)
    private SharingType sharingType;

    @Column(name = "base_monthly_rent", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseMonthlyRent;

    @Builder.Default
    @Column(name = "has_attached_bathroom", nullable = false)
    private boolean hasAttachedBathroom = false;

    @Builder.Default
    @Column(name = "has_balcony", nullable = false)
    private boolean hasBalcony = false;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
