package com.pgmanagement.saas.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Shared JSON error writer for servlet security and rate-limiting filters.
 */
final class SecurityResponseWriter {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private SecurityResponseWriter() {
    }

    static void writeError(
            HttpServletRequest request,
            HttpServletResponse response,
            HttpStatus status,
            String error,
            String message) throws IOException {

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        body.put("path", request.getServletPath());
        body.put("timestamp", Instant.now().toString());

        MAPPER.writeValue(response.getOutputStream(), body);
    }
}
