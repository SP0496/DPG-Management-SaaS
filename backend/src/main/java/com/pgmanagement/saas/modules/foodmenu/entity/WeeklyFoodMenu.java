package com.pgmanagement.saas.modules.foodmenu.entity;

import com.pgmanagement.saas.shared.entity.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "weekly_food_menus")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyFoodMenu extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "property_id")
    private UUID propertyId;

    @Column(name = "day_of_week", nullable = false, length = 16)
    private String dayOfWeek;

    @Column(name = "day_order", nullable = false)
    private Integer dayOrder;

    @Column(nullable = false, length = 255)
    private String breakfast;

    @Column(nullable = false, length = 255)
    private String lunch;

    @Column(nullable = false, length = 255)
    private String dinner;

    @Column(length = 255)
    private String snacks;
}
