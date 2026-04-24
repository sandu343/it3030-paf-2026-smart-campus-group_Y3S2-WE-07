package com.smartcampus.backend.model;

/**
 * Enum representing the status of a booking throughout its lifecycle.
 * 
 * Workflow:
 * PENDING → APPROVED/REJECTED
 * APPROVED → CANCELLED
 * REJECTED → (terminal state)
 * CANCELLED → (terminal state)
 */
public enum BookingStatus {
    PENDING,      // Initial state when booking is created
    APPROVED,     // Admin approved the booking
    REJECTED,     // Admin rejected the booking
    CANCELLED     // User or system cancelled the booking
}
