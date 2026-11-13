package com.pgmanagement.saas.shared.exception;

import com.pgmanagement.saas.shared.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.List;

/**
 * Global REST exception handler returning sanitized structured error payloads.
 * Internal SQL details, stack traces, and class names are never exposed to clients.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        List<ErrorResponse.ValidationError> validationErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toValidationError)
                .toList();

        return buildError(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                "Input validation failed for one or more fields",
                request,
                validationErrors
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", "Request parameter validation failed", request, null);
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<ErrorResponse> handleMalformedRequest(
            Exception ex, HttpServletRequest request) {
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", "Malformed or invalid request payload", request, null);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(
            BadRequestException ex, HttpServletRequest request) {
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage(), request, null);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(
            UnauthorizedException ex, HttpServletRequest request) {
        return buildError(HttpStatus.UNAUTHORIZED, "Unauthorized", ex.getMessage(), request, null);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {
        return buildError(HttpStatus.UNAUTHORIZED, "Unauthorized", "Invalid email or password", request, null);
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLocked(
            LockedException ex, HttpServletRequest request) {
        return buildError(
                HttpStatus.FORBIDDEN,
                "Forbidden",
                "Account is locked due to excessive failed login attempts",
                request,
                null
        );
    }

    @ExceptionHandler({AccessDeniedException.class, ForbiddenException.class})
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            Exception ex, HttpServletRequest request) {
        return buildError(
                HttpStatus.FORBIDDEN,
                "Forbidden",
                "You do not have permission to access this resource",
                request,
                null
        );
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        return buildError(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage(), request, null);
    }

    @ExceptionHandler({ConflictException.class, OptimisticLockingFailureException.class})
    public ResponseEntity<ErrorResponse> handleConflict(
            Exception ex, HttpServletRequest request) {
        String message = ex instanceof ConflictException
                ? ex.getMessage()
                : "Concurrent modification detected. Please retry the operation.";
        return buildError(HttpStatus.CONFLICT, "Conflict", message, request, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation on path {}: {}", request.getServletPath(), ex.getMessage());
        return buildError(
                HttpStatus.CONFLICT,
                "Conflict",
                "A conflicting record already exists or referenced entity is invalid",
                request,
                null
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, HttpServletRequest request) {
        log.error("Unhandled internal server error on path {}", request.getServletPath(), ex);
        return buildError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                "An unexpected error occurred. Please contact support.",
                request,
                null
        );
    }

    private ErrorResponse.ValidationError toValidationError(FieldError error) {
        return new ErrorResponse.ValidationError(error.getField(), error.getDefaultMessage());
    }

    private ResponseEntity<ErrorResponse> buildError(
            HttpStatus status,
            String error,
            String message,
            HttpServletRequest request,
            List<ErrorResponse.ValidationError> validationErrors) {

        ErrorResponse response = ErrorResponse.builder()
                .success(false)
                .status(status.value())
                .error(error)
                .message(message)
                .path(request.getServletPath())
                .timestamp(Instant.now())
                .errors(validationErrors)
                .build();

        return ResponseEntity.status(status).body(response);
    }
}
