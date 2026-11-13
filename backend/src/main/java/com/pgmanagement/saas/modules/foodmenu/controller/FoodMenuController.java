package com.pgmanagement.saas.modules.foodmenu.controller;

import com.pgmanagement.saas.modules.foodmenu.dto.request.UpsertFoodMenuRequest;
import com.pgmanagement.saas.modules.foodmenu.dto.response.FoodMenuResponse;
import com.pgmanagement.saas.modules.foodmenu.service.FoodMenuService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/food-menu")
@RequiredArgsConstructor
@Tag(name = "Food Menu", description = "Weekly PG mess menu read and owner management endpoints")
public class FoodMenuController {

    private final FoodMenuService foodMenuService;

    @GetMapping
    @Operation(summary = "Get weekly PG food menu scoped to resident PG or owner property")
    public ResponseEntity<ApiResponse<List<FoodMenuResponse>>> getWeeklyMenu(
            @RequestParam(required = false) UUID propertyId) {
        List<FoodMenuResponse> menu = foodMenuService.getWeeklyMenu(
                TenantContext.currentUserId(),
                TenantContext.currentRole(),
                propertyId
        );
        return ResponseEntity.ok(ApiResponse.success(menu));
    }

    @PutMapping
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Create or update a day's mess menu (Owner only)")
    public ResponseEntity<ApiResponse<FoodMenuResponse>> upsertDayMenu(
            @Valid @RequestBody UpsertFoodMenuRequest request) {
        FoodMenuResponse updated = foodMenuService.upsertDayMenu(TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Food menu updated"));
    }
}
