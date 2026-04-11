package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.*;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * BookingService - Service interface for booking management.
 * 
 * Defines all business logic operations for the Booking Management module:
 * - Creating new bookings with conflict detection
 * - Updating booking status with workflow validation
 * - Finding available slots
 * - Filtering bookings by various criteria
 * - Role-based access control
 */
public interface BookingService {

    // ===== CREATE BOOKING =====

    /**
     * Create a new booking with validation and conflict detection.
     * 
     * @param request CreateBookingRequest containing booking details
     * @param userId  ID of the user creating the booking
     * @return BookingResponse with created booking details
     * @throws BookingConflictException  if time slot is already booked
     * @throws ResourceNotFoundException if resource doesn't exist
     * @throws ValidationException       if input validation fails
     */
    BookingResponse createBooking(CreateBookingRequest request, String userId);

    /**
     * Check if a booking time slot conflicts with existing bookings.
     * 
     * This is the CRITICAL conflict detection algorithm:
     * Two bookings conflict if: new.startTime < existing.endTime AND new.endTime >
     * existing.startTime
     * 
     * @param resourceId the resource being booked
     * @param date       the booking date
     * @param startTime  proposed start time
     * @param endTime    proposed end time
     * @return true if conflict exists, false otherwise
     */
    boolean hasConflict(String resourceId, LocalDate date, LocalTime startTime, LocalTime endTime);

    /**
     * Find all conflicts for a proposed booking.
     * 
     * @param resourceId the resource being booked
     * @param date       the booking date
     * @param startTime  proposed start time
     * @param endTime    proposed end time
     * @return list of conflicting bookings
     */
    List<Booking> findConflicts(String resourceId, LocalDate date, LocalTime startTime, LocalTime endTime);

    // ===== SMART SUGGESTION =====

    /**
     * Get the next available time slot for a resource on a given date.
     * 
     * Algorithm:
     * 1. Query all PENDING + APPROVED bookings for the date
     * 2. Sort by start time
     * 3. Find first available 30-minute slot
     * 4. Work in 30-minute intervals (e.g., 09:00-09:30, 09:30-10:00)
     * 5. Respect working hours (typically 08:00-18:00)
     * 
     * @param resourceId the resource
     * @param date       the booking date
     * @return AvailableSlotResponse with next available slot
     */
    AvailableSlotResponse suggestNextAvailableSlot(String resourceId, LocalDate date);

    /**
     * Get multiple available slots for a resource on a given date.
     * 
     * @param resourceId the resource
     * @param date       the booking date
     * @param slotCount  number of suggested slots to return
     * @return list of available slots
     */
    List<AvailableSlotResponse> suggestAvailableSlots(String resourceId, LocalDate date, int slotCount);

    /**
     * Get available slots within a custom time range for a given date.
     *
     * @param resourceId the resource
     * @param date       the booking date
     * @param slotCount  number of suggested slots to return
     * @param rangeStart optional range start (defaults to working hours start)
     * @param rangeEnd   optional range end (defaults to working hours end)
     * @return list of available slots
     */
    List<AvailableSlotResponse> suggestAvailableSlots(
            String resourceId,
            LocalDate date,
            int slotCount,
            LocalTime rangeStart,
            LocalTime rangeEnd);

    // ===== UPDATE BOOKING STATUS =====

    /**
     * Update booking status with workflow validation.
     * 
     * Valid transitions:
     * - PENDING → APPROVED
     * - PENDING → REJECTED
     * - APPROVED → CANCELLED
     * - Other transitions are invalid
     * 
     * @param bookingId the booking to update
     * @param request   UpdateBookingStatusRequest with new status and reason
     * @param adminId   ID of the admin making the change
     * @return BookingResponse with updated booking
     * @throws BookingNotFoundException      if booking doesn't exist
     * @throws InvalidBookingStatusException if transition is invalid
     */
    BookingResponse updateBookingStatus(String bookingId, UpdateBookingStatusRequest request, String adminId);

    /**
     * Cancel a booking (typically by user).
     * 
     * @param bookingId the booking to cancel
     * @param userId    ID of the user (must be booking owner)
     * @param reason    reason for cancellation
     * @return BookingResponse with cancelled booking
     * @throws UnauthorizedException         if user is not the booking owner
     * @throws InvalidBookingStatusException if booking cannot be cancelled
     */
    BookingResponse cancelBooking(String bookingId, String userId, String reason);

    // ===== GET BOOKINGS (FILTERING) =====

    /**
     * Get all bookings for a specific user.
     * 
     * @param userId the user ID
     * @return list of user's bookings
     */
    List<BookingResponse> getUserBookings(String userId);

    /**
     * Get all bookings for a resource.
     * 
     * @param resourceId the resource ID
     * @return list of all bookings for the resource
     */
    List<BookingResponse> getResourceBookings(String resourceId);

    /**
     * Get all bookings (admin only).
     * 
     * @return list of all bookings
     */
    List<BookingResponse> getAllBookings();

    /**
     * Get bookings with multiple filters.
     * 
     * @param resourceId optional: filter by resource
     * @param date       optional: filter by date
     * @param status     optional: filter by status
     * @return list of filtered bookings
     */
    List<BookingResponse> filterBookings(String resourceId, LocalDate date, BookingStatus status);

    /**
     * Get pending bookings that need admin approval.
     * 
     * @return list of pending bookings
     */
    List<BookingResponse> getPendingBookings();

    /**
     * Get a single booking by ID.
     * 
     * @param bookingId the booking ID
     * @return BookingResponse with booking details
     * @throws BookingNotFoundException if booking doesn't exist
     */
    BookingResponse getBookingById(String bookingId);

    /**
     * Get bookings for a resource within a date range.
     * 
     * @param resourceId the resource ID
     * @param startDate  start date (inclusive)
     * @param endDate    end date (inclusive)
     * @return list of bookings within the range
     */
    List<BookingResponse> getBookingsByDateRange(String resourceId, LocalDate startDate, LocalDate endDate);

    // ===== VALIDATION & UTILITY METHODS =====

    /**
     * Validate that a proposed booking time is valid.
     * - startTime must be before endTime
     * - date cannot be in the past
     * - time slot must be within working hours (optional)
     * 
     * @param date      the booking date
     * @param startTime the start time
     * @param endTime   the end time
     * @throws ValidationException if validation fails
     */
    void validateBookingTime(LocalDate date, LocalTime startTime, LocalTime endTime);

    /**
     * Validate that status transition is allowed.
     * 
     * @param currentStatus the current status
     * @param newStatus     the proposed new status
     * @throws InvalidBookingStatusException if transition is invalid
     */
    void validateStatusTransition(BookingStatus currentStatus, BookingStatus newStatus);
}
