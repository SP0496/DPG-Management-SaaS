package com.pgmanagement.saas.modules.property.dto.response;

import com.pgmanagement.saas.modules.property.entity.Property;
import com.pgmanagement.saas.modules.property.entity.PropertyType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class PropertyResponse {

    private UUID id;
    private UUID ownerId;
    private String name;
    private PropertyType propertyType;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String emergencyContact;
    private int defaultBillingDay;
    private int gracePeriodDays;
    private BigDecimal lateFeeAmount;
    private String amenities;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public static PropertyResponse from(Property property) {
        return PropertyResponse.builder()
                .id(property.getId())
                .ownerId(property.getOwnerId())
                .name(property.getName())
                .propertyType(property.getPropertyType())
                .addressLine1(property.getAddressLine1())
                .addressLine2(property.getAddressLine2())
                .city(property.getCity())
                .state(property.getState())
                .postalCode(property.getPostalCode())
                .emergencyContact(property.getEmergencyContact())
                .defaultBillingDay(property.getDefaultBillingDay())
                .gracePeriodDays(property.getGracePeriodDays())
                .lateFeeAmount(property.getLateFeeAmount())
                .amenities(property.getAmenities())
                .active(property.isActive())
                .createdAt(property.getCreatedAt())
                .updatedAt(property.getUpdatedAt())
                .build();
    }
}
