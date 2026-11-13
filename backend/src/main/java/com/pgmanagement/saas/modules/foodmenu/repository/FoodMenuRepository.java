package com.pgmanagement.saas.modules.foodmenu.repository;

import com.pgmanagement.saas.modules.foodmenu.entity.WeeklyFoodMenu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FoodMenuRepository extends JpaRepository<WeeklyFoodMenu, UUID> {

    List<WeeklyFoodMenu> findAllByOwnerIdAndPropertyIdOrderByDayOrderAsc(UUID ownerId, UUID propertyId);

    List<WeeklyFoodMenu> findAllByOwnerIdAndPropertyIdIsNullOrderByDayOrderAsc(UUID ownerId);

    Optional<WeeklyFoodMenu> findByOwnerIdAndPropertyIdAndDayOfWeekIgnoreCase(
            UUID ownerId, UUID propertyId, String dayOfWeek);

    Optional<WeeklyFoodMenu> findByOwnerIdAndPropertyIdIsNullAndDayOfWeekIgnoreCase(
            UUID ownerId, String dayOfWeek);
}
