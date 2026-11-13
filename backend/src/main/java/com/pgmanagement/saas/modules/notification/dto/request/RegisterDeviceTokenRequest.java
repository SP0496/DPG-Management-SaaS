package com.pgmanagement.saas.modules.notification.dto.request;

import com.pgmanagement.saas.modules.notification.entity.DevicePlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterDeviceTokenRequest {

    @NotBlank(message = "Device token is required")
    @Size(max = 512, message = "Device token cannot exceed 512 characters")
    private String token;

    private DevicePlatform platform = DevicePlatform.ANDROID;

    @Size(max = 30)
    private String appVersion;
}
