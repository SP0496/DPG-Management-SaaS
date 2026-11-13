package com.pgmanagement.saas.shared.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Strict Cross-Origin Resource Sharing configuration using explicit allowed origin allowlists.
 */
@Configuration
public class CorsConfig {

    @Value("${app.security.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${app.security.cors.allowed-methods:GET,POST,PUT,PATCH,DELETE,OPTIONS}")
    private String allowedMethods;

    @Value("${app.security.cors.allowed-headers:Authorization,Content-Type,X-Requested-With,Accept,Origin}")
    private String allowedHeaders;

    @Value("${app.security.cors.max-age:3600}")
    private long maxAge;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(splitCsv(allowedOrigins));
        configuration.setAllowedMethods(splitCsv(allowedMethods));
        configuration.setAllowedHeaders(splitCsv(allowedHeaders));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(maxAge);
        configuration.setExposedHeaders(List.of("Authorization", "Retry-After"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private List<String> splitCsv(String raw) {
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
