package com.pgmanagement.saas.modules.auth.firebase;

import com.pgmanagement.saas.shared.util.PhoneNumberUtils;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@ConfigurationProperties(prefix = "app.firebase")
@Getter
@Setter
public class FirebaseProperties {

    private boolean enabled = true;
    private String projectId;
    private String credentialsPath;
    private String credentialsJson;
    private String ownerPhones;

    public Set<String> normalizedOwnerPhones() {
        if (ownerPhones == null || ownerPhones.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(ownerPhones.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(PhoneNumberUtils::normalizeIndianE164)
                .collect(Collectors.toUnmodifiableSet());
    }
}
