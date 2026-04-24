package com.smartcampus.backend.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Booking Model - Represents a resource booking in the Smart Campus system.
 * 
 * A booking represents a user's request to reserve a resource (e.g., classroom, lab, meeting room)
 * for a specific date and time period. The booking follows a workflow: PENDING → APPROVED/REJECTED/CANCELLED
 * 
 * Key Features:
 * - Integrates with Resource module (resourceId)
 * - Stores user details and attendee information
 * - Tracks booking status and reasons for rejections/cancellations
 * - Maintains timestamps for audit trail
 * - Uses compound index for efficient conflict detection queries
 */
@Document(collection = "bookings")
@CompoundIndex(name = "resource_date_idx", def = "{'resourceId': 1, 'date': 1}")
public class Booking {
    
    @Id
    private String id;

    /**
     * Reference to the Resource being booked.
     * This ensures the booking integrates dynamically with the Resource module.
     */
    @NotBlank(message = "Resource ID is required")
    @Indexed
    private String resourceId;

    /**
     * ID of the user creating the booking.
     * Used for role-based filtering (users see only their bookings)
     */
    @NotBlank(message = "User ID is required")
    @Indexed
    private String userId;

    /**
     * Name of the user who created the booking.
     * Denormalized for convenience in responses.
     */
    private String userName;

    /**
     * Booking date (date part only, time is stored separately)
     * This enables efficient date-based queries for conflict detection
     */
    @NotNull(message = "Booking date is required")
    @Indexed
    private LocalDate date;

    /**
     * Start time of the booking (e.g., 09:30)
     * Combined with startTime, used for conflict detection
     */
    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    /**
     * End time of the booking (e.g., 11:00)
     * Must be after startTime
     */
    @NotNull(message = "End time is required")
    private LocalTime endTime;

    /**
     * Purpose of the booking (e.g., "Class Lecture", "Project Meeting")
     */
    @NotBlank(message = "Purpose is required")
    private String purpose;

    /**
     * Number of attendees for this booking.
     * Useful for resource capacity validation.
     */
    @Positive(message = "Attendees must be greater than 0")
    private int attendees;

    /**
     * Current status of the booking.
     * Defaults to PENDING when created.
     */
    @NotNull(message = "Booking status is required")
    @Indexed
    private BookingStatus status = BookingStatus.PENDING;

    /**
     * Reason for rejection or cancellation.
     * Populated when admin rejects or user cancels the booking.
     */
    private String reason;

    /**
     * Additional notes or special requests for the booking.
     */
    private String notes;

    /**
     * ID of the admin who approved/rejected the booking.
     * Used for audit trail.
     */
    private String approvedByAdminId;

    /**
     * Timestamp when the booking was created.
     * Automatically set by Spring Data.
     */
    @CreatedDate
    private LocalDateTime createdAt;

    /**
     * Timestamp when the booking was last modified.
     * Automatically updated by Spring Data.
     */
    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * Timestamp when the booking status was last changed.
     * Used for booking history and audit trail.
     */
    private LocalDateTime statusChangedAt;

    // Constructors

    public Booking() {
    }

    public Booking(String resourceId, String userId, String userName, LocalDate date,
                   LocalTime startTime, LocalTime endTime, String purpose, int attendees) {
        this.resourceId = resourceId;
        this.userId = userId;
        this.userName = userName;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.purpose = purpose;
        this.attendees = attendees;
        this.status = BookingStatus.PENDING;
        this.statusChangedAt = LocalDateTime.now();
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public int getAttendees() {
        return attendees;
    }

    public void setAttendees(int attendees) {
        this.attendees = attendees;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getApprovedByAdminId() {
        return approvedByAdminId;
    }

    public void setApprovedByAdminId(String approvedByAdminId) {
        this.approvedByAdminId = approvedByAdminId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getStatusChangedAt() {
        return statusChangedAt;
    }

    public void setStatusChangedAt(LocalDateTime statusChangedAt) {
        this.statusChangedAt = statusChangedAt;
    }

    @Override
    public String toString() {
        return "Booking{" +
                "id='" + id + '\'' +
                ", resourceId='" + resourceId + '\'' +
                ", userId='" + userId + '\'' +
                ", date=" + date +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", purpose='" + purpose + '\'' +
                ", status=" + status +
                ", createdAt=" + createdAt +
                '}';
    }
}
