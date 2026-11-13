package com.pgmanagement.saas.modules.foodmenu.service;

import com.pgmanagement.saas.modules.booking.entity.Booking;
import com.pgmanagement.saas.modules.booking.service.BookingService;
import com.pgmanagement.saas.modules.foodmenu.dto.request.UpsertFoodMenuRequest;
import com.pgmanagement.saas.modules.foodmenu.dto.response.FoodMenuResponse;
import com.pgmanagement.saas.modules.foodmenu.entity.WeeklyFoodMenu;
import com.pgmanagement.saas.modules.foodmenu.repository.FoodMenuRepository;
import com.pgmanagement.saas.modules.property.service.PropertyService;
import com.pgmanagement.saas.modules.resident.service.ResidentService;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FoodMenuService {

    private record DefaultDaySpec(int order, String day, String breakfast, String lunch, String dinner, String snacks) {
    }

    private static final List<DefaultDaySpec> STANDARD_WEEK_MENU = List.of(
            new DefaultDaySpec(1, "Monday", "Idli, Vada & Sambar", "Steamed Rice, Dal Tadka, Mix Veg, Curd", "Chapati, Paneer Butter Masala, Jeera Rice", "Tea & Biscuits"),
            new DefaultDaySpec(2, "Tuesday", "Poha, Peanuts & Masala Chai", "Rajma Chawal, Boondi Raita, Salad", "Phulka, Aloo Gobi, Dal Fry", "Roasted Chana & Tea"),
            new DefaultDaySpec(3, "Wednesday", "Masala Dosa & Coconut Chutney", "Rice, Sambar, Beans Poriyal, Buttermilk", "Chapati, Egg / Matar Masala, Rice", "Samosa & Mint Chutney"),
            new DefaultDaySpec(4, "Thursday", "Aloo Paratha & Curd", "Khichdi, Kadhi Pakora, Papad", "Roti, Chana Masala, Veg Pulao", "Banana & Filter Coffee"),
            new DefaultDaySpec(5, "Friday", "Upma, Boiled Egg / Fruit", "Rice, Palak Dal, Bhindi Fry, Curd", "Chapati, Veg Kurma, Plain Rice", "Poha Chivda & Tea"),
            new DefaultDaySpec(6, "Saturday", "Poori Bhaji & Coffee", "Veg Pulao, Mirchi Ka Salan, Raita", "Paratha, Soyabean Curry, Dal", "Bread Pakora & Tea"),
            new DefaultDaySpec(7, "Sunday", "Chole Bhature & Sweet Lassi", "Special Veg Biryani, Raita, Gulab Jamun", "Light Rice, Rasam, Aloo Fry", "Masala Corn & Tea")
    );

    private static final Map<String, DefaultDaySpec> DAY_LOOKUP = Map.of(
            "MONDAY", STANDARD_WEEK_MENU.get(0),
            "TUESDAY", STANDARD_WEEK_MENU.get(1),
            "WEDNESDAY", STANDARD_WEEK_MENU.get(2),
            "THURSDAY", STANDARD_WEEK_MENU.get(3),
            "FRIDAY", STANDARD_WEEK_MENU.get(4),
            "SATURDAY", STANDARD_WEEK_MENU.get(5),
            "SUNDAY", STANDARD_WEEK_MENU.get(6)
    );

    private final FoodMenuRepository foodMenuRepository;
    private final PropertyService propertyService;
    private final BookingService bookingService;
    private final ResidentService residentService;

    @Transactional
    public List<FoodMenuResponse> getWeeklyMenu(UUID userId, Role role, UUID propertyId) {
        if (role == Role.OWNER) {
            if (propertyId != null) {
                propertyService.assertActivePropertyOwnedBy(propertyId, userId);
                return mergePropertyMenuWithOwnerDefaults(userId, propertyId);
            }
            return getOrSeedDefaultOwnerMenu(userId).stream().map(FoodMenuResponse::from).toList();
        }

        Optional<Booking> activeBooking = bookingService.findOptionalActiveResidentBooking(userId);
        if (activeBooking.isPresent()) {
            Booking booking = activeBooking.get();
            return mergePropertyMenuWithOwnerDefaults(booking.getOwnerId(), booking.getPropertyId());
        }

        Optional<UUID> linkedOwnerId = residentService.findOwnerIdForResident(userId);
        if (linkedOwnerId.isEmpty()) {
            return List.of();
        }
        return getOrSeedDefaultOwnerMenu(linkedOwnerId.get()).stream()
                .map(FoodMenuResponse::from)
                .toList();
    }

    @Transactional
    public FoodMenuResponse upsertDayMenu(UUID ownerId, UpsertFoodMenuRequest request) {
        if (request.getPropertyId() != null) {
            propertyService.assertActivePropertyOwnedBy(request.getPropertyId(), ownerId);
        } else {
            getOrSeedDefaultOwnerMenu(ownerId);
        }

        String dayKey = request.getDayOfWeek().trim().toUpperCase(Locale.ROOT);
        DefaultDaySpec daySpec = DAY_LOOKUP.get(dayKey);
        if (daySpec == null) {
            throw new BadRequestException("Invalid dayOfWeek. Expected Monday through Sunday.");
        }

        WeeklyFoodMenu entity = (request.getPropertyId() != null
                ? foodMenuRepository.findByOwnerIdAndPropertyIdAndDayOfWeekIgnoreCase(
                        ownerId, request.getPropertyId(), daySpec.day())
                : foodMenuRepository.findByOwnerIdAndPropertyIdIsNullAndDayOfWeekIgnoreCase(
                        ownerId, daySpec.day()))
                .orElseGet(() -> WeeklyFoodMenu.builder()
                        .ownerId(ownerId)
                        .propertyId(request.getPropertyId())
                        .dayOfWeek(daySpec.day())
                        .dayOrder(daySpec.order())
                        .build());

        entity.setDayOfWeek(daySpec.day());
        entity.setDayOrder(daySpec.order());
        entity.setBreakfast(request.getBreakfast().trim());
        entity.setLunch(request.getLunch().trim());
        entity.setDinner(request.getDinner().trim());
        entity.setSnacks(trimOrNull(request.getSnacks()));

        return FoodMenuResponse.from(foodMenuRepository.save(entity));
    }

    private List<FoodMenuResponse> mergePropertyMenuWithOwnerDefaults(UUID ownerId, UUID propertyId) {
        List<WeeklyFoodMenu> baseWeek = getOrSeedDefaultOwnerMenu(ownerId);
        List<WeeklyFoodMenu> overrides =
                foodMenuRepository.findAllByOwnerIdAndPropertyIdOrderByDayOrderAsc(ownerId, propertyId);
        if (overrides.isEmpty()) {
            return baseWeek.stream().map(FoodMenuResponse::from).toList();
        }
        Map<Integer, WeeklyFoodMenu> byOrder = new java.util.LinkedHashMap<>();
        for (WeeklyFoodMenu day : baseWeek) {
            byOrder.put(day.getDayOrder(), day);
        }
        for (WeeklyFoodMenu custom : overrides) {
            byOrder.put(custom.getDayOrder(), custom);
        }
        return byOrder.values().stream().map(FoodMenuResponse::from).toList();
    }

    private List<WeeklyFoodMenu> getOrSeedDefaultOwnerMenu(UUID ownerId) {
        List<WeeklyFoodMenu> existing = foodMenuRepository.findAllByOwnerIdAndPropertyIdIsNullOrderByDayOrderAsc(ownerId);
        if (!existing.isEmpty()) {
            return existing;
        }
        List<WeeklyFoodMenu> defaults = STANDARD_WEEK_MENU.stream()
                .map(spec -> WeeklyFoodMenu.builder()
                        .ownerId(ownerId)
                        .propertyId(null)
                        .dayOfWeek(spec.day())
                        .dayOrder(spec.order())
                        .breakfast(spec.breakfast())
                        .lunch(spec.lunch())
                        .dinner(spec.dinner())
                        .snacks(spec.snacks())
                        .build())
                .toList();
        return foodMenuRepository.saveAll(defaults);
    }

    private String trimOrNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
