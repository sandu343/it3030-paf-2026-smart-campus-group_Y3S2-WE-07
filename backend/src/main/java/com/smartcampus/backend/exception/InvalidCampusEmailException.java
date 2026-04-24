package com.smartcampus.backend.exception;

public class InvalidCampusEmailException extends RuntimeException {
    public InvalidCampusEmailException(String message) {
        super(message);
    }
    
    public InvalidCampusEmailException(String message, Throwable cause) {
        super(message, cause);
    }
}
