package com.pgmanagement.saas.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rooms", uniqueConstraints = {
    @UniqueConstraint(name = "uk_room_property", columnNames = {"property_id", "room_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(name = "room_number", nullable = false, length = 20)
    private String roomNumber;

    @Column(name = "floor_number", nullable = false)
    @Builder.Default
    private int floorNumber = 1;

    @Column(name = "sharing_type", nullable = false, length = 50)
    private String sharingType;

    @Column(name = "base_monthly_rent", nullable = false, precision = 10, scale = 2)
    private BigDecimal baseMonthlyRent;

    @Column(name = "has_attached_bathroom", nullable = false)
    @Builder.Default
    private boolean hasAttachedBathroom = false;

    @Column(name = "has_balcony", nullable = false)
    @Builder.Default
    private boolean hasBalcony = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
