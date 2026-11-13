package com.pgmanagement.saas.modules.property.service;

import com.pgmanagement.saas.modules.property.dto.request.PropertyRequest;
import com.pgmanagement.saas.modules.property.dto.request.UpdateRentConfigRequest;
import com.pgmanagement.saas.modules.property.dto.response.PropertyResponse;
import com.pgmanagement.saas.modules.property.entity.Property;
import com.pgmanagement.saas.modules.property.repository.PropertyRepository;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;

    @Transactional
    public PropertyResponse createProperty(UUID ownerId, PropertyRequest request) {
        Property property = Property.builder()
                .ownerId(ownerId)
                .active(true)
                .build();
        applyRequest(property, request);
        return PropertyResponse.from(propertyRepository.save(property));
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> listOwnerProperties(UUID ownerId) {
        return propertyRepository.findAllByOwnerIdAndActiveTrue(ownerId)
                .stream()
                .map(PropertyResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<PropertyResponse> searchOwnerProperties(
            UUID ownerId, String search, int page, int size) {
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<PropertyResponse> filtered = propertyRepository.findAllByOwnerIdAndActiveTrue(ownerId)
                .stream()
                .filter(p -> normalizedSearch.isEmpty()
                        || p.getName().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                        || p.getCity().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                        || p.getState().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                        || p.getAddressLine1().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                .map(PropertyResponse::from)
                .toList();
        return PagedResponse.ofList(filtered, page, size);
    }

    @Transactional
    public PropertyResponse updateRentConfig(UUID propertyId, UUID ownerId, UpdateRentConfigRequest request) {
        Property property = getOwnedEntity(propertyId, ownerId);
        property.setDefaultBillingDay(request.getDefaultBillingDay());
        property.setGracePeriodDays(request.getGracePeriodDays());
        property.setLateFeeAmount(request.getLateFeeAmount());
        return PropertyResponse.from(propertyRepository.save(property));
    }

    @Transactional(readOnly = true)
    public Property findEntityForRead(UUID propertyId) {
        return propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("PG property not found"));
    }

    @Transactional(readOnly = true)
    public PropertyResponse getOwnedProperty(UUID propertyId, UUID ownerId) {
        return PropertyResponse.from(getOwnedEntity(propertyId, ownerId));
    }

    @Transactional
    public PropertyResponse updateProperty(UUID propertyId, UUID ownerId, PropertyRequest request) {
        Property property = getOwnedEntity(propertyId, ownerId);
        applyRequest(property, request);
        return PropertyResponse.from(propertyRepository.save(property));
    }

    @Transactional
    public void deactivateProperty(UUID propertyId, UUID ownerId) {
        Property property = getOwnedEntity(propertyId, ownerId);
        property.setActive(false);
        propertyRepository.save(property);
    }

    @Transactional(readOnly = true)
    public void assertActivePropertyOwnedBy(UUID propertyId, UUID ownerId) {
        if (!propertyRepository.existsByIdAndOwnerIdAndActiveTrue(propertyId, ownerId)) {
            throw new ResourceNotFoundException("Active PG property not found for this owner");
        }
    }

    private Property getOwnedEntity(UUID propertyId, UUID ownerId) {
        return propertyRepository.findByIdAndOwnerId(propertyId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("PG property not found for this owner"));
    }

    private void applyRequest(Property property, PropertyRequest request) {
        property.setName(request.getName().trim());
        property.setPropertyType(request.getPropertyType());
        property.setAddressLine1(request.getAddressLine1().trim());
        property.setAddressLine2(trimOrNull(request.getAddressLine2()));
        property.setCity(request.getCity().trim());
        property.setState(request.getState().trim());
        property.setPostalCode(request.getPostalCode().trim());
        property.setEmergencyContact(request.getEmergencyContact().trim());
        property.setDefaultBillingDay(request.getDefaultBillingDay() != null ? request.getDefaultBillingDay() : 1);
        property.setGracePeriodDays(request.getGracePeriodDays() != null ? request.getGracePeriodDays() : 5);
        property.setLateFeeAmount(request.getLateFeeAmount() != null ? request.getLateFeeAmount() : BigDecimal.ZERO);
        property.setAmenities(trimOrNull(request.getAmenities()));
    }

    private String trimOrNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
