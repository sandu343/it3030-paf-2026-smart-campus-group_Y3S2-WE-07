package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * BookingRepository - Data access layer for Booking documents.
 * 
 * Provides custom queries optimized for:
 * - Conflict detection (overlapping bookings)
 * - Filtering by resource, date, status
 * - Finding available time slots
 * - User-specific and admin-specific queries
 */
public interface BookingRepository extends MongoRepository<Booking, String> {

    // ===== CONFLICT DETECTION QUERIES =====
    
    /**
     * Find all NON-REJECTED bookings for a specific resource on a given date.
     * Used to detect time conflicts when creating/updating bookings.
     * 
     * Excludes REJECTED bookings since they are not actual reservations.
     * Includes: PENDING, APPROVED, CANCELLED (to show what times are occupied)
     * 
     * @param resourceId the resource being booked
     * @param date the booking date
     * @return list of bookings that may conflict
     */
    @Query("{ 'resourceId': ?0, 'date': ?1, 'status': { $ne: 'REJECTED' } }")
    List<Booking> findConflictingBookings(String resourceId, LocalDate date);

    /**
     * Find active (PENDING or APPROVED) bookings for a resource on a specific date.
     * These are the only bookings that truly block a time slot.
     * 
     * @param resourceId the resource being booked
     * @param date the booking date
     * @return list of active bookings
     */
    @Query("{ 'resourceId': ?0, 'date': ?1, 'status': { $in: ['PENDING', 'APPROVED'] } }")
    List<Booking> findActiveBookingsForDate(String resourceId, LocalDate date);

    // ===== USER-SPECIFIC QUERIES =====
    
    /**
     * Get all bookings created by a specific user.
     * Used for user dashboard and personal booking history.
     * 
     * @param userId the user ID
     * @return list of user's bookings
     */
    List<Booking> findByUserId(String userId);

    /**
     * Get all non-rejected bookings for a user.
     * Filters out rejected bookings from user's view.
     * 
     * @param userId the user ID
     * @return list of user's active/cancelled bookings
     */
    @Query("{ 'userId': ?0, 'status': { $ne: 'REJECTED' } }")
    List<Booking> findActiveBookingsByUserId(String userId);

    /**
     * Get bookings for a user with specific status.
     * 
     * @param userId the user ID
     * @param status the booking status
     * @return list of bookings with that status
     */
    List<Booking> findByUserIdAndStatus(String userId, BookingStatus status);

    // ===== RESOURCE-SPECIFIC QUERIES =====
    
    /**
     * Get all approved and pending bookings for a resource.
     * Used to check resource availability and capacity constraints.
     * 
     * @param resourceId the resource ID
     * @return list of active bookings for the resource
     */
    @Query("{ 'resourceId': ?0, 'status': { $in: ['PENDING', 'APPROVED'] } }")
    List<Booking> findActiveBookingsByResourceId(String resourceId);

    /**
     * Get all bookings for a resource regardless of status.
     * 
     * @param resourceId the resource ID
     * @return list of all bookings for the resource
     */
    List<Booking> findByResourceId(String resourceId);

    /**
     * Get bookings for a resource within a date range.
     * Used for generating booking calendars and availability reports.
     * 
     * @param resourceId the resource ID
     * @param startDate start date (inclusive)
     * @param endDate end date (inclusive)
     * @return list of bookings within the date range
     */
    @Query("{ 'resourceId': ?0, 'date': { $gte: ?1, $lte: ?2 } }")
    List<Booking> findByResourceIdAndDateRange(String resourceId, LocalDate startDate, LocalDate endDate);

    // ===== STATUS-BASED QUERIES =====
    
    /**
     * Find all bookings with a specific status.
     * 
     * @param status the booking status
     * @return list of bookings with that status
     */
    List<Booking> findByStatus(BookingStatus status);

    /**
     * Find all PENDING bookings that need admin approval.
     * 
     * @return list of pending bookings
     */
    @Query("{ 'status': 'PENDING' }")
    List<Booking> findPendingBookings();

    /**
     * Find all APPROVED bookings.
     * 
     * @return list of approved bookings
     */
    @Query("{ 'status': 'APPROVED' }")
    List<Booking> findApprovedBookings();

    /**
     * Find all CANCELLED bookings.
     * 
     * @return list of cancelled bookings
     */
    @Query("{ 'status': 'CANCELLED' }")
    List<Booking> findCancelledBookings();

    /**
     * Find all REJECTED bookings.
     * 
     * @return list of rejected bookings
     */
    @Query("{ 'status': 'REJECTED' }")
    List<Booking> findRejectedBookings();

    // ===== COMBINED FILTER QUERIES =====
    
    /**
     * Get bookings by resource and status.
     * 
     * @param resourceId the resource ID
     * @param status the booking status
     * @return list of bookings matching both criteria
     */
    List<Booking> findByResourceIdAndStatus(String resourceId, BookingStatus status);

    /**
     * Get bookings by date and status.
     * Used for admin dashboard to see status distribution by date.
     * 
     * @param date the booking date
     * @param status the booking status
     * @return list of bookings on that date with the status
     */
    List<Booking> findByDateAndStatus(LocalDate date, BookingStatus status);

    /**
     * Get bookings by resource, date, and status.
     * 
     * @param resourceId the resource ID
     * @param date the booking date
     * @param status the booking status
     * @return list of bookings matching all criteria
     */
    List<Booking> findByResourceIdAndDateAndStatus(String resourceId, LocalDate date, BookingStatus status);

    // ===== PAGINATION AND COUNT QUERIES =====
    
    /**
     * Count active bookings for a resource on a specific date.
     * Used to validate capacity constraints.
     * 
     * @param resourceId the resource ID
     * @param date the booking date
     * @return count of active bookings
     */
    @Query("{ 'resourceId': ?0, 'date': ?1, 'status': { $in: ['PENDING', 'APPROVED'] } }")
    long countActiveBookingsForDate(String resourceId, LocalDate date);

    /**
     * Count PENDING bookings for a resource.
     * Used to prioritize admin workload.
     * 
     * @param resourceId the resource ID
     * @return count of pending bookings
     */
    long countByResourceIdAndStatus(String resourceId, BookingStatus status);

    /**
     * Check if a booking exists for a user on a specific resource and date.
     * 
     * @param userId the user ID
     * @param resourceId the resource ID
     * @param date the booking date
     * @return true if exists, false otherwise
     */
    boolean existsByUserIdAndResourceIdAndDate(String userId, String resourceId, LocalDate date);

    /**
     * Find the most recent booking created by a user.
     * Used for quick access to latest booking.
     * 
     * @param userId the user ID
     * @return optional containing the latest booking or empty
     */
    @Query("{ 'userId': ?0 }")
    Optional<Booking> findMostRecentByUserId(String userId);

    // ===== CLEANUP AND MAINTENANCE QUERIES =====
    
    /**
     * Find old rejected bookings (for cleanup/archival).
     * Helps maintain database performance.
     * 
     * @param beforeDate delete bookings rejected before this date
     * @return list of old rejected bookings
     */
    @Query("{ 'status': 'REJECTED', 'updatedAt': { $lt: ?0 } }")
    List<Booking> findOldRejectedBookings(LocalDateTime beforeDate);
}
