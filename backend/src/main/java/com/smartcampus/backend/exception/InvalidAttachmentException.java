package com.smartcampus.backend.exception;

public class InvalidAttachmentException extends RuntimeException {
    public InvalidAttachmentException(String message) {
        super(message);
    }
}
