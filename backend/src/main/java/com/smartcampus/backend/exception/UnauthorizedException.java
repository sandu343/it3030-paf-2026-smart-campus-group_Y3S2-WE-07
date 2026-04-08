package com.smartcampus.backend.exception;

/**
 * Exception thrown when a user is not authorized to perform an action.
 * E.g., trying to cancel someone else's booking without admin privileges.
 */
public class UnauthorizedException extends RuntimeException {
    
    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
