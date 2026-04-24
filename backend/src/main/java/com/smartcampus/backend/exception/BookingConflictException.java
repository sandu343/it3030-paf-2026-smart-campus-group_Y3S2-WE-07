package com.smartcampus.backend.exception;

/**
 * Exception thrown when a booking conflicts with an existing booking.
 * Used when attempting to create or update a booking with overlapping time slots.
 */
public class BookingConflictException extends RuntimeException {
    
    public BookingConflictException(String message) {
        super(message);
    }

    public BookingConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
