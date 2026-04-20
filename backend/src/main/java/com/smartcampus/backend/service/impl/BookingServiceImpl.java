package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.*;
import com.smartcampus.backend.exception.*;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.BookingService;
import com.smartcampus.backend.service.NotificationTriggerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * BookingServiceImpl - Implementation of BookingService interface.
 * 
 * Implements all booking management business logic including:
 * - Booking creation with comprehensive validation
 * - Conflict detection (critical algorithm)
 * - Smart time slot suggestions
 * - Status workflow management
 * - Advanced filtering and querying
 * 
 * All methods are transactional to ensure data consistency.
 */
@Service
@Transactional
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationTriggerService notificationTriggerService;

    // Working hours for slot suggestions (08:00 to 18:00)
    private static final LocalTime WORKING_HOURS_START = LocalTime.of(8, 0);
    private static final LocalTime WORKING_HOURS_END = LocalTime.of(18, 0);
    private static final int SLOT_DURATION_MINUTES = 30; // 30-minute slots

    public BookingServiceImpl(BookingRepository bookingRepository,
            ResourceRepository resourceRepository,
            UserRepository userRepository,
            NotificationTriggerService notificationTriggerService) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.notificationTriggerService = notificationTriggerService;
    }

    // ===== CREATE BOOKING =====

    @Override
    public BookingResponse createBooking(CreateBookingRequest request, String userId) {
        // Validate basic booking time constraints
        validateBookingTime(request.getDate(), request.getStartTime(), request.getEndTime());

        // Fetch and validate resource exists
        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resource not found with ID: " + request.getResourceId()));

        // Get user info for denormalization
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        // CRITICAL: Check for time conflicts
        if (hasConflict(request.getResourceId(), request.getDate(),
                request.getStartTime(), request.getEndTime())) {
            throw new BookingConflictException(
                    "This time slot is already booked. " +
                            "Resource " + resource.getHallName() + " is not available from " +
                            request.getStartTime() + " to " + request.getEndTime() + " on " +
                            request.getDate());
        }

        // Create new booking
        Booking booking = new Booking(
                request.getResourceId(),
                userId,
                user.getName(),
                request.getDate(),
                request.getStartTime(),
                request.getEndTime(),
                request.getPurpose(),
                request.getAttendees());

        booking.setNotes(request.getNotes());
        booking.setStatus(BookingStatus.PENDING);
        booking.setStatusChangedAt(LocalDateTime.now());

        // Save to database
        Booking savedBooking = bookingRepository.save(booking);

        notificationTriggerService.triggerBookingCreatedNotification(
                savedBooking.getId(),
                resource.getHallName(),
                savedBooking.getDate(),
                user.getName());

        // Convert to response with resource details
        return convertToResponse(savedBooking, resource);
    }

    // ===== CONFLICT DETECTION (CRITICAL ALGORITHM) =====

    @Override
    public boolean hasConflict(String resourceId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<Booking> existingBookings = bookingRepository.findActiveBookingsForDate(resourceId, date);

        for (Booking existing : existingBookings) {
            // CONFLICT DETECTION ALGORITHM (5 lines):
            // Two bookings conflict if the new booking starts before the existing one ends
            // AND the new booking ends after the existing one starts.
            if (startTime.isBefore(existing.getEndTime()) && endTime.isAfter(existing.getStartTime())) {
                return true; // Conflict detected
            }
        }
        return false; // No conflicts
    }

    @Override
    public List<Booking> findConflicts(String resourceId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<Booking> existingBookings = bookingRepository.findActiveBookingsForDate(resourceId, date);

        return existingBookings.stream()
                .filter(booking -> startTime.isBefore(booking.getEndTime()) &&
                        endTime.isAfter(booking.getStartTime()))
                .collect(Collectors.toList());
    }

    // ===== SMART SUGGESTION =====

    @Override
    public AvailableSlotResponse suggestNextAvailableSlot(String resourceId, LocalDate date) {
        List<AvailableSlotResponse> slots = suggestAvailableSlots(resourceId, date, 1, null, null);
        return slots.isEmpty() ? null : slots.get(0);
    }

    @Override
    public List<AvailableSlotResponse> suggestAvailableSlots(String resourceId, LocalDate date, int slotCount) {
        return suggestAvailableSlots(resourceId, date, slotCount, null, null);
    }

    @Override
    public List<AvailableSlotResponse> suggestAvailableSlots(
            String resourceId,
            LocalDate date,
            int slotCount,
            LocalTime rangeStart,
            LocalTime rangeEnd) {
        // Fetch all active bookings for this date
        List<Booking> bookings = bookingRepository.findActiveBookingsForDate(resourceId, date);
        List<AvailableSlotResponse> availableSlots = new ArrayList<>();

        LocalTime windowStart = rangeStart == null ? WORKING_HOURS_START : rangeStart;
        LocalTime windowEnd = rangeEnd == null ? WORKING_HOURS_END : rangeEnd;

        if (windowStart.isBefore(WORKING_HOURS_START) || windowEnd.isAfter(WORKING_HOURS_END)) {
            throw new ValidationException("Selected range must be within working hours (08:00 to 18:00)");
        }

        if (!windowStart.isBefore(windowEnd)) {
            throw new ValidationException("Start time must be before end time for slot range");
        }

        int safeSlotCount = Math.max(1, slotCount);

        // Sort bookings by start time
        bookings.sort(Comparator.comparing(Booking::getStartTime));

        LocalTime currentTime = windowStart;

        // Iterate through the day and find free slots
        while (currentTime.isBefore(windowEnd) && availableSlots.size() < safeSlotCount) {
            final LocalTime slotStart = currentTime;
            LocalTime slotEnd = slotStart.plusMinutes(SLOT_DURATION_MINUTES);

            // Stop if generated slot exceeds selected range
            if (slotEnd.isAfter(windowEnd)) {
                break;
            }

            // Check if this slot overlaps with any existing booking
            boolean isSlotFree = bookings.stream()
                    .noneMatch(booking -> slotStart.isBefore(booking.getEndTime()) &&
                            slotEnd.isAfter(booking.getStartTime()));

            if (isSlotFree) {
                String description = String.format("Available from %s to %s",
                        slotStart.toString(),
                        slotEnd.toString());
                availableSlots.add(new AvailableSlotResponse(slotStart, slotEnd, description));
            }

            currentTime = slotEnd;
        }

        return availableSlots;
    }

    // ===== UPDATE BOOKING STATUS =====

    @Override
    public BookingResponse updateBookingStatus(String bookingId, UpdateBookingStatusRequest request, String adminId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        Resource resource = resourceRepository.findById(booking.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        // Validate status transition
        validateStatusTransition(booking.getStatus(), request.getStatus());

        // Update booking
        booking.setStatus(request.getStatus());
        booking.setReason(request.getReason());
        booking.setApprovedByAdminId(adminId);
        booking.setStatusChangedAt(LocalDateTime.now());

        // Save updated booking
        Booking updatedBooking = bookingRepository.save(booking);

        if (updatedBooking.getStatus() == BookingStatus.APPROVED) {
            notificationTriggerService.triggerBookingApprovedNotification(
                    updatedBooking.getUserId(),
                    updatedBooking.getId(),
                    resource.getHallName(),
                    updatedBooking.getDate());
        } else if (updatedBooking.getStatus() == BookingStatus.REJECTED) {
            notificationTriggerService.triggerBookingRejectedNotification(
                    updatedBooking.getUserId(),
                    updatedBooking.getId(),
                    resource.getHallName(),
                    updatedBooking.getDate(),
                    updatedBooking.getReason() != null ? updatedBooking.getReason() : "No reason provided");
        }

        return convertToResponse(updatedBooking, resource);
    }

    @Override
    public BookingResponse cancelBooking(String bookingId, String userId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        // Only booking owner or admin can cancel
        if (!booking.getUserId().equals(userId)) {
            throw new UnauthorizedException("You can only cancel your own bookings");
        }

        // Can only cancel PENDING or APPROVED bookings
        if (!booking.getStatus().equals(BookingStatus.PENDING) &&
                !booking.getStatus().equals(BookingStatus.APPROVED)) {
            throw new InvalidBookingStatusException(
                    "Cannot cancel booking with status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setReason(reason);
        booking.setStatusChangedAt(LocalDateTime.now());

        Booking updatedBooking = bookingRepository.save(booking);

        Resource resource = resourceRepository.findById(updatedBooking.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        return convertToResponse(updatedBooking, resource);
    }

    // ===== GET BOOKINGS (FILTERING) =====

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(String userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        return enrichBookingsWithResources(bookings);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getResourceBookings(String resourceId) {
        List<Booking> bookings = bookingRepository.findByResourceId(resourceId);
        return enrichBookingsWithResources(bookings);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        return enrichBookingsWithResources(bookings);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> filterBookings(String resourceId, LocalDate date, BookingStatus status) {
        List<Booking> bookings;

        if (resourceId != null && date != null && status != null) {
            bookings = bookingRepository.findByResourceIdAndDateAndStatus(resourceId, date, status);
        } else if (resourceId != null && date != null) {
            bookings = bookingRepository.findByResourceIdAndDateRange(resourceId, date, date);
        } else if (resourceId != null && status != null) {
            bookings = bookingRepository.findByResourceIdAndStatus(resourceId, status);
        } else if (date != null && status != null) {
            bookings = bookingRepository.findByDateAndStatus(date, status);
        } else if (resourceId != null) {
            bookings = bookingRepository.findByResourceId(resourceId);
        } else if (status != null) {
            bookings = bookingRepository.findByStatus(status);
        } else {
            bookings = bookingRepository.findAll();
        }

        return enrichBookingsWithResources(bookings);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getPendingBookings() {
        List<Booking> bookings = bookingRepository.findPendingBookings();
        return enrichBookingsWithResources(bookings);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        Resource resource = resourceRepository.findById(booking.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        return convertToResponse(booking, resource);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByDateRange(String resourceId, LocalDate startDate, LocalDate endDate) {
        List<Booking> bookings = bookingRepository.findByResourceIdAndDateRange(resourceId, startDate, endDate);
        return enrichBookingsWithResources(bookings);
    }

    // ===== VALIDATION & UTILITY METHODS =====

    @Override
    public void validateBookingTime(LocalDate date, LocalTime startTime, LocalTime endTime) {
        // Check date is not in the past
        if (date.isBefore(LocalDate.now())) {
            throw new ValidationException("Booking date cannot be in the past");
        }

        // Check startTime is before endTime
        if (!startTime.isBefore(endTime)) {
            throw new ValidationException("Start time must be before end time");
        }

        // Check times are within working hours (optional - can be customized)
        if (startTime.isBefore(WORKING_HOURS_START) || endTime.isAfter(WORKING_HOURS_END)) {
            throw new ValidationException(
                    "Booking times must be within working hours (" + WORKING_HOURS_START +
                            " to " + WORKING_HOURS_END + ")");
        }
    }

    @Override
    public void validateStatusTransition(BookingStatus currentStatus, BookingStatus newStatus) {
        boolean isValid = false;

        // Define valid transitions
        if (currentStatus == BookingStatus.PENDING) {
            // From PENDING, can go to APPROVED or REJECTED
            isValid = (newStatus == BookingStatus.APPROVED || newStatus == BookingStatus.REJECTED);
        } else if (currentStatus == BookingStatus.APPROVED) {
            // From APPROVED, can only go to CANCELLED
            isValid = (newStatus == BookingStatus.CANCELLED);
        }
        // From REJECTED or CANCELLED, no transitions allowed (terminal states)

        if (!isValid) {
            throw new InvalidBookingStatusException(
                    "Invalid status transition from " + currentStatus + " to " + newStatus);
        }
    }

    // ===== HELPER METHODS =====

    /**
     * Convert Booking entity to BookingResponse DTO with resource details.
     */
    private BookingResponse convertToResponse(Booking booking, Resource resource) {
        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setResourceId(booking.getResourceId());
        response.setResourceName(resource.getHallName());
        response.setResourceCapacity(resource.getCapacity());
        response.setUserId(booking.getUserId());
        response.setUserName(booking.getUserName());
        response.setDate(booking.getDate());
        response.setStartTime(booking.getStartTime());
        response.setEndTime(booking.getEndTime());
        response.setPurpose(booking.getPurpose());
        response.setAttendees(booking.getAttendees());
        response.setStatus(booking.getStatus());
        response.setReason(booking.getReason());
        response.setApprovedByAdminId(booking.getApprovedByAdminId());
        response.setCreatedAt(booking.getCreatedAt());
        response.setUpdatedAt(booking.getUpdatedAt());
        response.setStatusChangedAt(booking.getStatusChangedAt());
        response.setNotes(booking.getNotes());

        // Set canCancel flag: only if user is owner and status is PENDING or APPROVED
        response.setCanCancel(booking.getStatus() == BookingStatus.PENDING ||
                booking.getStatus() == BookingStatus.APPROVED);

        return response;
    }

    /**
     * Enrich multiple bookings with resource details.
     */
    private List<BookingResponse> enrichBookingsWithResources(List<Booking> bookings) {
        return bookings.stream()
                .map(booking -> {
                    Resource resource = resourceRepository.findById(booking.getResourceId())
                            .orElse(null);
                    if (resource == null) {
                        throw new ResourceNotFoundException(
                                "Resource not found for booking: " + booking.getId());
                    }
                    return convertToResponse(booking, resource);
                })
                .collect(Collectors.toList());
    }
}
