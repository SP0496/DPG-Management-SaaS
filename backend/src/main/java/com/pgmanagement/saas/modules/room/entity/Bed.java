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
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "beds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bed extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "bed_code", nullable = false, length = 40)
    private String bedCode;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BedStatus status = BedStatus.VACANT;

    @Version
    @Column(nullable = false)
    private Long version;
}
