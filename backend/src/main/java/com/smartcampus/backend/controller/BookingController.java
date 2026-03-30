package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.*;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * BookingController - REST API endpoints for Booking Management.
 * 
 * Provides comprehensive booking operations:
 * - Create, read, update, delete bookings
 * - Admin operations (approve, reject)
 * - User operations (view own, cancel)
 * - Smart features (available slots, conflict detection)
 * - Advanced filtering and querying
 * 
 * Endpoints:
 * POST /api/bookings - Create booking
 * GET /api/bookings - Get all bookings (admin)
 * GET /api/bookings/{id} - Get single booking
 * GET /api/bookings/user/{userId} - Get user's bookings
 * GET /api/bookings/resource/{resourceId} - Get resource's bookings
 * GET /api/bookings/available-slots - Get available time slots
 * GET /api/bookings/pending - Get pending bookings (admin)
 * GET /api/bookings/filter - Filter bookings by criteria
 * PUT /api/bookings/{id}/status - Update booking status (admin)
 * DELETE /api/bookings/{id} - Cancel booking (user)
 */
@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // ===== CREATE BOOKING =====

    /**
     * Create a new booking.
     * 
     * User must be authenticated. The system will:
     * - Validate booking time (not in past, start < end, within working hours)
     * - Check resource exists
     * - Detect time conflicts
     * - Create booking with PENDING status
     * 
     * @param request        booking details with validation
     * @param authentication current authenticated user
     * @return BookingResponse with created booking
     * @status 201 CREATED on success
     * @status 400 BAD_REQUEST on validation failure
     * @status 409 CONFLICT if time slot is booked
     * @status 404 NOT_FOUND if resource doesn't exist
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        BookingResponse response = bookingService.createBooking(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ===== GET BOOKINGS (SPECIFIC QUERIES - MUST COME BEFORE /{id}) =====

    /**
     * Get all bookings for a specific user.
     * 
     * User can see only their own bookings. Admin can see any user's bookings.
     * 
     * @param userId the user ID
     * @return list of user's bookings
     * @status 200 OK
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponse>> getUserBookings(@PathVariable String userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = auth.getName();

        // Users can only view their own bookings (unless admin)
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !currentUserId.equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<BookingResponse> bookings = bookingService.getUserBookings(userId);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get all bookings for a specific resource.
     * 
     * Shows all bookings (pending, approved, cancelled, rejected) for a resource.
     * Useful for admin dashboard and resource availability views.
     * 
     * @param resourceId the resource ID
     * @return list of bookings for the resource
     * @status 200 OK
     */
    @GetMapping("/resource/{resourceId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponse>> getResourceBookings(@PathVariable String resourceId) {
        List<BookingResponse> bookings = bookingService.getResourceBookings(resourceId);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get available time slots for a resource on a given date.
     * 
     * SMART SUGGESTION FEATURE:
     * - Scans resource's bookings for the date
     * - Identifies all free 30-minute slots
     * - Works within working hours (08:00-18:00)
     * - Returns multiple suggestions for user convenience
     * 
     * @param resourceId the resource to check
     * @param date       the booking date (format: YYYY-MM-DD)
     * @param slotCount  number of suggestions to return (default: 5)
     * @return list of available time slots with descriptions
     * @status 200 OK
     */
    @GetMapping("/available-slots")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AvailableSlotResponse>> getAvailableSlots(
            @RequestParam String resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "5") int slotCount,
            @RequestParam(required = false) @DateTimeFormat(pattern = "HH:mm") LocalTime fromTime,
            @RequestParam(required = false) @DateTimeFormat(pattern = "HH:mm") LocalTime toTime) {
        List<AvailableSlotResponse> slots = bookingService.suggestAvailableSlots(
                resourceId,
                date,
                slotCount,
                fromTime,
                toTime);
        return ResponseEntity.ok(slots);
    }

    /**
     * Get all pending bookings (awaiting admin approval).
     * 
     * ADMIN ONLY ENDPOINT.
     * Used for admin dashboard to review and approve/reject pending bookings.
     * 
     * @return list of pending bookings
     * @status 200 OK
     * @status 403 FORBIDDEN if not admin
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getPendingBookings() {
        List<BookingResponse> bookings = bookingService.getPendingBookings();
        return ResponseEntity.ok(bookings);
    }

    /**
     * Filter bookings by multiple criteria.
     * 
     * All parameters are optional. Can filter by:
     * - resourceId: specific resource
     * - date: specific date
     * - status: booking status (PENDING, APPROVED, REJECTED, CANCELLED)
     * 
     * If no filters provided, returns all bookings (admin only).
     * 
     * @param resourceId optional: filter by resource
     * @param date       optional: filter by date (format: YYYY-MM-DD)
     * @param status     optional: filter by status
     * @return filtered list of bookings
     * @status 200 OK
     */
    @GetMapping("/filter")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponse>> filterBookings(
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) BookingStatus status) {
        List<BookingResponse> bookings = bookingService.filterBookings(resourceId, date, status);
        return ResponseEntity.ok(bookings);
    }

    // ===== GET SINGLE BOOKING =====

    /**
     * Get a single booking by ID.
     * 
     * @param id the booking ID
     * @return booking details with resource information
     * @status 200 OK
     * @status 404 NOT_FOUND if booking doesn't exist
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable String id) {
        BookingResponse booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(booking);
    }

    // ===== GET ALL BOOKINGS =====

    /**
     * Get all bookings in the system.
     * 
     * ADMIN ONLY ENDPOINT.
     * Returns all bookings regardless of status or user.
     * 
     * @return list of all bookings
     * @status 200 OK
     * @status 403 FORBIDDEN if not admin
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        List<BookingResponse> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(bookings);
    }

    // ===== UPDATE BOOKING STATUS (ADMIN) =====

    /**
     * Update booking status (approve or reject).
     * 
     * ADMIN ONLY ENDPOINT.
     * 
     * Valid transitions:
     * - PENDING → APPROVED (admin approves)
     * - PENDING → REJECTED (admin rejects with reason)
     * - APPROVED → CANCELLED (user cancels, but admin can also initiate)
     * 
     * @param id             the booking ID
     * @param request        new status and reason
     * @param authentication admin user
     * @return updated booking
     * @status 200 OK
     * @status 400 BAD_REQUEST if status transition is invalid
     * @status 404 NOT_FOUND if booking doesn't exist
     * @status 403 FORBIDDEN if not admin
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> updateBookingStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateBookingStatusRequest request,
            Authentication authentication) {
        String adminId = authentication.getName();
        BookingResponse response = bookingService.updateBookingStatus(id, request, adminId);
        return ResponseEntity.ok(response);
    }

    // ===== CANCEL BOOKING (USER) =====

    /**
     * Cancel a pending or approved booking.
     * 
     * Only the booking owner can cancel their own bookings.
     * Can cancel bookings with PENDING or APPROVED status.
     * Requires a reason for the cancellation.
     * 
     * @param id             the booking ID
     * @param reason         reason for cancellation
     * @param authentication current user
     * @return cancelled booking
     * @status 200 OK
     * @status 400 BAD_REQUEST if booking cannot be cancelled
     * @status 403 FORBIDDEN if not booking owner
     * @status 404 NOT_FOUND if booking doesn't exist
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        BookingResponse response = bookingService.cancelBooking(id, userId, reason);
        return ResponseEntity.ok(response);
    }
}
