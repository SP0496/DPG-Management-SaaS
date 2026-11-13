package com.pgmanagement.saas.modules.booking.controller;

import com.pgmanagement.saas.modules.booking.dto.request.ProposeRentRevisionRequest;
import com.pgmanagement.saas.modules.booking.dto.request.RespondRentRevisionRequest;
import com.pgmanagement.saas.modules.booking.dto.request.UpdateBookingRentRequest;
import com.pgmanagement.saas.modules.booking.dto.response.BookingResponse;
import com.pgmanagement.saas.modules.booking.dto.response.RentRevisionResponse;
import com.pgmanagement.saas.modules.booking.entity.BookingStatus;
import com.pgmanagement.saas.modules.booking.service.BookingService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.dto.PagedResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings & Assignments", description = "Paginated booking search and rent adjustments")
public class BookingSearchController {

    private final BookingService bookingService;

    @GetMapping("/search")
    @Operation(summary = "Search and paginate bookings scoped to owner or resident")
    public ResponseEntity<ApiResponse<PagedResponse<BookingResponse>>> searchBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<BookingResponse> result = bookingService.searchBookings(
                TenantContext.currentUserId(),
                TenantContext.currentRole(),
                status,
                propertyId,
                search,
                page,
                size
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PatchMapping("/{bookingId}/rent")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Update agreed monthly rent for an active booking")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBookingRent(
            @PathVariable UUID bookingId,
            @Valid @RequestBody UpdateBookingRentRequest request) {
        BookingResponse updated = bookingService.updateAgreedRent(bookingId, TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Booking monthly rent updated"));
    }

    @PostMapping("/{bookingId}/rent-revisions")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Propose a formal rent revision agreement with effective date for resident acceptance")
    public ResponseEntity<ApiResponse<RentRevisionResponse>> proposeRentRevision(
            @PathVariable UUID bookingId,
            @Valid @RequestBody ProposeRentRevisionRequest request) {
        RentRevisionResponse created = bookingService.proposeRentRevision(
                bookingId, TenantContext.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Rent revision proposed and sent to resident for acceptance"));
    }

    @PostMapping("/rent-revisions/{revisionId}/respond")
    @PreAuthorize("hasRole('RESIDENT')")
    @Operation(summary = "Accept or reject a pending rent revision agreement")
    public ResponseEntity<ApiResponse<RentRevisionResponse>> respondToRentRevision(
            @PathVariable UUID revisionId,
            @Valid @RequestBody RespondRentRevisionRequest request) {
        RentRevisionResponse updated = bookingService.respondToRentRevision(
                revisionId, TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Rent revision response recorded"));
    }

    @GetMapping("/rent-revisions")
    @Operation(summary = "List rent revision agreements scoped to authenticated owner or resident")
    public ResponseEntity<ApiResponse<List<RentRevisionResponse>>> listRentRevisions() {
        List<RentRevisionResponse> revisions = bookingService.listRentRevisions(
                TenantContext.currentUserId(), TenantContext.currentRole());
        return ResponseEntity.ok(ApiResponse.success(revisions));
    }
}
