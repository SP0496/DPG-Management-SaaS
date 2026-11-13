package com.pgmanagement.saas.modules.auth.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

@Configuration
@EnableConfigurationProperties(FirebaseProperties.class)
@RequiredArgsConstructor
@Slf4j
public class FirebaseConfig {

    private final FirebaseProperties properties;

    @Bean
    @Conditional(FirebaseAppCondition.class)
    public synchronized FirebaseApp firebaseApp() throws IOException {
        FirebaseApp defaultApp = findDefaultApp();
        if (defaultApp != null) {
            if (isMatchingDefaultApp(defaultApp, properties.getProjectId())) {
                log.info("Reusing existing default FirebaseApp for project '{}'", defaultApp.getOptions().getProjectId());
                return defaultApp;
            }
            log.warn("Existing default FirebaseApp project '{}' does not match expected project '{}'. Reinitializing.",
                    defaultApp.getOptions().getProjectId(), properties.getProjectId());
            defaultApp.delete();
        }

        GoogleCredentials credentials = resolveCredentials(properties);
        if (credentials == null) {
            throw new IllegalStateException("Firebase credentials unavailable during FirebaseApp initialization");
        }

        FirebaseOptions.Builder builder = FirebaseOptions.builder()
                .setCredentials(credentials);
        if (StringUtils.hasText(properties.getProjectId())) {
            builder.setProjectId(properties.getProjectId().trim());
        }

        FirebaseApp initialized = FirebaseApp.initializeApp(builder.build());
        log.info("Firebase Admin SDK initialized successfully for project '{}'", initialized.getOptions().getProjectId());
        return initialized;
    }

    public static FirebaseApp findDefaultApp() {
        for (FirebaseApp app : FirebaseApp.getApps()) {
            if (FirebaseApp.DEFAULT_APP_NAME.equals(app.getName())) {
                return app;
            }
        }
        return null;
    }

    public static boolean isMatchingDefaultApp(FirebaseApp app, String expectedProjectId) {
        if (app == null || !FirebaseApp.DEFAULT_APP_NAME.equals(app.getName())) {
            return false;
        }
        if (!StringUtils.hasText(expectedProjectId)) {
            return true;
        }
        String existingProjectId = app.getOptions() != null ? app.getOptions().getProjectId() : null;
        return expectedProjectId.trim().equalsIgnoreCase(existingProjectId);
    }

    public static GoogleCredentials resolveCredentials(FirebaseProperties properties) throws IOException {
        if (StringUtils.hasText(properties.getCredentialsJson())) {
            String raw = properties.getCredentialsJson().trim();
            byte[] jsonBytes = raw.startsWith("{")
                    ? raw.getBytes(StandardCharsets.UTF_8)
                    : Base64.getDecoder().decode(raw);
            try (InputStream stream = new ByteArrayInputStream(jsonBytes)) {
                return GoogleCredentials.fromStream(stream);
            }
        }

        if (StringUtils.hasText(properties.getCredentialsPath())) {
            Path path = Path.of(properties.getCredentialsPath().trim());
            if (!Files.exists(path) || !Files.isRegularFile(path)) {
                throw new IOException("Credentials file not found at configured credentials-path: " + path);
            }
            try (InputStream stream = Files.newInputStream(path)) {
                return GoogleCredentials.fromStream(stream);
            }
        }

        try {
            return GoogleCredentials.getApplicationDefault();
        } catch (IOException ex) {
            return null;
        }
    }

    public static class FirebaseAppCondition implements Condition {

        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            FirebaseProperties properties = Binder.get(context.getEnvironment())
                    .bind("app.firebase", FirebaseProperties.class)
                    .orElseGet(FirebaseProperties::new);

            if (!properties.isEnabled()) {
                return false;
            }

            FirebaseApp defaultApp = findDefaultApp();
            if (defaultApp != null && isMatchingDefaultApp(defaultApp, properties.getProjectId())) {
                return true;
            }

            try {
                GoogleCredentials credentials = resolveCredentials(properties);
                return credentials != null;
            } catch (Exception ex) {
                return false;
            }
        }
    }
}
