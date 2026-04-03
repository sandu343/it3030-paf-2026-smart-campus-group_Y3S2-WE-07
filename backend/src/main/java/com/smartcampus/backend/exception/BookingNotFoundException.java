package com.smartcampus.backend.exception;

/**
 * Exception thrown when a booking is not found.
 */
public class BookingNotFoundException extends RuntimeException {
    
    public BookingNotFoundException(String message) {
        super(message);
    }

    public BookingNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
