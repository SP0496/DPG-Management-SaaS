package com.pgmanagement.saas.modules.foodmenu.dto.response;

import com.pgmanagement.saas.modules.foodmenu.entity.WeeklyFoodMenu;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class FoodMenuResponse {

    private UUID id;
    private UUID propertyId;
    private String day;
    private Integer dayOrder;
    private String breakfast;
    private String lunch;
    private String dinner;
    private String snacks;

    public static FoodMenuResponse from(WeeklyFoodMenu entity) {
        return FoodMenuResponse.builder()
                .id(entity.getId())
                .propertyId(entity.getPropertyId())
                .day(entity.getDayOfWeek())
                .dayOrder(entity.getDayOrder())
                .breakfast(entity.getBreakfast())
                .lunch(entity.getLunch())
                .dinner(entity.getDinner())
                .snacks(entity.getSnacks())
                .build();
    }
}
