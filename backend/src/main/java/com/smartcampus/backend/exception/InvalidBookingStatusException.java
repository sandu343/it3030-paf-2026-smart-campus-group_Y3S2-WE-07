package com.smartcampus.backend.exception;

/**
 * Exception thrown when a booking status transition is invalid.
 * E.g., trying to approve an already approved booking, or reject a cancelled booking.
 */
public class InvalidBookingStatusException extends RuntimeException {
    
    public InvalidBookingStatusException(String message) {
        super(message);
    }

    public InvalidBookingStatusException(String message, Throwable cause) {
        super(message, cause);
    }
}
