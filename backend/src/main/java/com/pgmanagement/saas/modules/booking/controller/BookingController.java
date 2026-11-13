package com.pgmanagement.saas.modules.booking.controller;

import com.pgmanagement.saas.modules.booking.dto.request.CheckoutRequest;
import com.pgmanagement.saas.modules.booking.dto.request.CreateBookingRequest;
import com.pgmanagement.saas.modules.booking.dto.request.GiveNoticeRequest;
import com.pgmanagement.saas.modules.booking.dto.response.BookingResponse;
import com.pgmanagement.saas.modules.booking.service.BookingService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings & Bed Assignments", description = "Bed allocation, resident stays, notice, and checkout endpoints")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Assign a vacant bed to a resident and create an active booking")
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody CreateBookingRequest request) {
        BookingResponse created = bookingService.createBooking(TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Bed assigned and booking created successfully"));
    }

    @GetMapping
    @Operation(summary = "List bookings scoped to authenticated owner or resident")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> listBookings() {
        List<BookingResponse> bookings = bookingService.listBookings(
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Get booking details scoped to owner or resident")
    public ResponseEntity<ApiResponse<BookingResponse>> getBooking(@PathVariable UUID bookingId) {
        BookingResponse booking = bookingService.getBooking(
                bookingId,
                TenantContext.currentUserId(),
                TenantContext.currentRole()
        );
        return ResponseEntity.ok(ApiResponse.success(booking));
    }

    @PatchMapping("/{bookingId}/notice")
    @Operation(summary = "Submit move-out notice for an active booking")
    public ResponseEntity<ApiResponse<BookingResponse>> giveNotice(
            @PathVariable UUID bookingId,
            @Valid @RequestBody GiveNoticeRequest request) {
        BookingResponse updated = bookingService.giveNotice(
                bookingId,
                TenantContext.currentUserId(),
                TenantContext.currentRole(),
                request
        );
        return ResponseEntity.ok(ApiResponse.success(updated, "Notice submitted successfully"));
    }

    @PatchMapping("/{bookingId}/checkout")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Check out a resident booking and release bed back to VACANT")
    public ResponseEntity<ApiResponse<BookingResponse>> checkout(
            @PathVariable UUID bookingId,
            @RequestBody(required = false) CheckoutRequest request) {
        BookingResponse updated = bookingService.checkout(bookingId, TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Resident checked out and bed released"));
    }
}
