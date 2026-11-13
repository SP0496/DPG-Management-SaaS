package com.pgmanagement.saas.modules.owner.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpsertOwnerProfileRequest {

    @NotBlank(message = "Business name is required")
    @Size(min = 2, max = 150, message = "Business name must be between 2 and 150 characters")
    private String businessName;

    @Size(max = 30, message = "GST number cannot exceed 30 characters")
    private String gstNumber;

    @Size(max = 20, message = "PAN number cannot exceed 20 characters")
    private String panNumber;

    @Pattern(regexp = "^(\\+?[1-9]\\d{7,14})?$", message = "Invalid support phone number format")
    private String supportPhone;

    @Email(message = "Invalid support email format")
    private String supportEmail;

    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;

    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State cannot exceed 100 characters")
    private String state;

    @Size(max = 20, message = "Postal code cannot exceed 20 characters")
    private String postalCode;

    @Pattern(regexp = "^([a-zA-Z0-9._-]{2,80}@[a-zA-Z0-9.-]{2,40})?$", message = "Invalid UPI ID format")
    private String upiId;

    @Size(max = 150, message = "UPI payee name cannot exceed 150 characters")
    private String upiPayeeName;

    @Size(max = 150, message = "Bank account holder name cannot exceed 150 characters")
    private String bankAccountHolder;

    @Size(max = 120, message = "Bank name cannot exceed 120 characters")
    private String bankName;

    @Size(max = 50, message = "Bank account number cannot exceed 50 characters")
    private String bankAccountNumber;

    @Pattern(regexp = "^([A-Z]{4}0[A-Z0-9]{6})?$", message = "Invalid IFSC code format")
    private String bankIfscCode;
}
