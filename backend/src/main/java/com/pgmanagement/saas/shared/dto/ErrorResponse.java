package com.pgmanagement.saas.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Standardized error payload masking internal implementation details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    @Builder.Default
    private boolean success = false;

    private int status;
    private String error;
    private String message;
    private String path;

    @Builder.Default
    private Instant timestamp = Instant.now();

    private List<ValidationError> errors;

    @Data
    @AllArgsConstructor
    public static class ValidationError {
        private String field;
        private String message;
    }
}
