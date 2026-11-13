package com.pgmanagement.saas.modules.foodmenu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class UpsertFoodMenuRequest {

    private UUID propertyId;

    @NotBlank(message = "Day of week is required")
    @Size(min = 3, max = 16)
    private String dayOfWeek;

    @NotBlank(message = "Breakfast menu is required")
    @Size(max = 255)
    private String breakfast;

    @NotBlank(message = "Lunch menu is required")
    @Size(max = 255)
    private String lunch;

    @NotBlank(message = "Dinner menu is required")
    @Size(max = 255)
    private String dinner;

    @Size(max = 255)
    private String snacks;
}
