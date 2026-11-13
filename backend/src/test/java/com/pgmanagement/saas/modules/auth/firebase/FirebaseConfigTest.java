package com.pgmanagement.saas.modules.auth.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.ArrayList;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

class FirebaseConfigTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(FirebaseConfig.class);

    private String validServiceAccountJson;

    @BeforeEach
    void setUp() throws Exception {
        cleanupFirebaseApps();
        validServiceAccountJson = generateTestServiceAccountJson("test-project-123");
    }

    @AfterEach
    void tearDown() {
        cleanupFirebaseApps();
    }

    private void cleanupFirebaseApps() {
        for (FirebaseApp app : new ArrayList<>(FirebaseApp.getApps())) {
            try {
                app.delete();
            } catch (Exception ignored) {
            }
        }
    }

    @Test
    void whenFirebaseEnabledAndValidCredentials_thenFirebaseAppBeanRegistered() {
        contextRunner
                .withPropertyValues(
                        "app.firebase.enabled=true",
                        "app.firebase.project-id=test-project-123",
                        "app.firebase.credentials-json=" + validServiceAccountJson
                )
                .run(context -> {
                    assertThat(context).hasSingleBean(FirebaseApp.class);
                    FirebaseApp app = context.getBean(FirebaseApp.class);
                    assertEquals("test-project-123", app.getOptions().getProjectId());
                });
    }

    @Test
    void whenFirebaseDisabled_thenNoFirebaseAppBeanRegistered() {
        contextRunner
                .withPropertyValues(
                        "app.firebase.enabled=false",
                        "app.firebase.credentials-json=" + validServiceAccountJson
                )
                .run(context -> {
                    assertThat(context).doesNotHaveBean(FirebaseApp.class);
                });
    }

    @Test
    void whenFirebaseCredentialsMissing_thenNoFirebaseAppBeanRegistered() {
        contextRunner
                .withPropertyValues(
                        "app.firebase.enabled=true",
                        "app.firebase.credentials-json=",
                        "app.firebase.credentials-path="
                )
                .run(context -> {
                    assertThat(context).doesNotHaveBean(FirebaseApp.class);
                });
    }

    @Test
    void whenFirebaseCredentialsPathDoesNotExist_thenNoFirebaseAppBeanRegistered() {
        contextRunner
                .withPropertyValues(
                        "app.firebase.enabled=true",
                        "app.firebase.credentials-path=/nonexistent/dummy/credentials.json"
                )
                .run(context -> {
                    assertThat(context).doesNotHaveBean(FirebaseApp.class);
                });
    }

    @Test
    void whenDefaultFirebaseAppAlreadyExistsWithMatchingProject_reusedWithoutDuplicateInit() throws Exception {
        byte[] bytes = validServiceAccountJson.getBytes(StandardCharsets.UTF_8);
        try (InputStream stream = new ByteArrayInputStream(bytes)) {
            GoogleCredentials creds = GoogleCredentials.fromStream(stream);
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(creds)
                    .setProjectId("test-project-123")
                    .build();
            FirebaseApp preExistingApp = FirebaseApp.initializeApp(options);

            contextRunner
                    .withPropertyValues(
                            "app.firebase.enabled=true",
                            "app.firebase.project-id=test-project-123",
                            "app.firebase.credentials-json=" + validServiceAccountJson
                    )
                    .run(context -> {
                        assertThat(context).hasSingleBean(FirebaseApp.class);
                        FirebaseApp app = context.getBean(FirebaseApp.class);
                        assertSame(preExistingApp, app);
                        assertEquals("test-project-123", app.getOptions().getProjectId());
                    });
        }
    }

    @Test
    void whenDefaultFirebaseAppExistsWithDifferentProject_itIsDeletedAndReinitialized() throws Exception {
        String oldProjectJson = generateTestServiceAccountJson("old-project-999");
        byte[] oldBytes = oldProjectJson.getBytes(StandardCharsets.UTF_8);
        try (InputStream stream = new ByteArrayInputStream(oldBytes)) {
            GoogleCredentials oldCreds = GoogleCredentials.fromStream(stream);
            FirebaseOptions oldOptions = FirebaseOptions.builder()
                    .setCredentials(oldCreds)
                    .setProjectId("old-project-999")
                    .build();
            FirebaseApp oldApp = FirebaseApp.initializeApp(oldOptions);
            assertEquals("old-project-999", oldApp.getOptions().getProjectId());

            contextRunner
                    .withPropertyValues(
                            "app.firebase.enabled=true",
                            "app.firebase.project-id=test-project-123",
                            "app.firebase.credentials-json=" + validServiceAccountJson
                    )
                    .run(context -> {
                        assertThat(context).hasSingleBean(FirebaseApp.class);
                        FirebaseApp newApp = context.getBean(FirebaseApp.class);
                        assertEquals("test-project-123", newApp.getOptions().getProjectId());
                    });
        }
    }

    private static String generateTestServiceAccountJson(String projectId) throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();
        String base64Key = Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded());
        String pem = "-----BEGIN PRIVATE KEY-----\\n" + base64Key + "\\n-----END PRIVATE KEY-----\\n";

        return "{\n" +
                "  \"type\": \"service_account\",\n" +
                "  \"project_id\": \"" + projectId + "\",\n" +
                "  \"private_key_id\": \"test-key-id\",\n" +
                "  \"private_key\": \"" + pem + "\",\n" +
                "  \"client_email\": \"firebase-adminsdk@" + projectId + ".iam.gserviceaccount.com\",\n" +
                "  \"client_id\": \"1234567890\",\n" +
                "  \"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\",\n" +
                "  \"token_uri\": \"https://oauth2.googleapis.com/token\"\n" +
                "}";
    }
}
