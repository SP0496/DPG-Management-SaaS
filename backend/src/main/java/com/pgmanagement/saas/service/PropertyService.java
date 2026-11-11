package com.pgmanagement.saas.service;

import com.pgmanagement.saas.dto.request.PropertyCreateRequest;
import com.pgmanagement.saas.entity.Organization;
import com.pgmanagement.saas.entity.Property;
import com.pgmanagement.saas.exception.BadRequestException;
import com.pgmanagement.saas.exception.ResourceNotFoundException;
import com.pgmanagement.saas.repository.OrganizationRepository;
import com.pgmanagement.saas.repository.PropertyRepository;
import com.pgmanagement.saas.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final OrganizationRepository organizationRepository;

    @Transactional(readOnly = true)
    public List<Property> getPropertiesForOrganization(UserPrincipal principal) {
        if (principal.getOrganizationId() == null) {
            throw new BadRequestException("User does not belong to any organization");
        }
        return propertyRepository.findByOrganizationIdAndActiveTrue(principal.getOrganizationId());
    }

    @Transactional(readOnly = true)
    public Property getPropertyById(UUID propertyId, UserPrincipal principal) {
        return propertyRepository.findByIdAndOrganizationId(propertyId, principal.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found or unauthorized"));
    }

    @Transactional
    public Property createProperty(PropertyCreateRequest request, UserPrincipal principal) {
        Organization organization = organizationRepository.findById(principal.getOrganizationId())
                .orElseThrow(() -> new BadRequestException("Organization not found"));

        Property property = Property.builder()
                .organization(organization)
                .name(request.getName().trim())
                .propertyType(request.getPropertyType().trim())
                .addressLine1(request.getAddressLine1().trim())
                .city(request.getCity().trim())
                .state(request.getState().trim())
                .postalCode(request.getPostalCode().trim())
                .emergencyContact(request.getEmergencyContact().trim())
                .active(true)
                .build();

        return propertyRepository.save(property);
    }
}
