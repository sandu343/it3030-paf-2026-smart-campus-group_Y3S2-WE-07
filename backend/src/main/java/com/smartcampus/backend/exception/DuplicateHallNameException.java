package com.smartcampus.backend.exception;

public class DuplicateHallNameException extends RuntimeException {
    public DuplicateHallNameException(String message) {
        super(message);
    }
}