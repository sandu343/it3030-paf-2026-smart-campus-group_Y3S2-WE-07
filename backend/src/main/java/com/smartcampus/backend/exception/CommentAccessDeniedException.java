package com.smartcampus.backend.exception;

public class CommentAccessDeniedException extends RuntimeException {
    public CommentAccessDeniedException(String message) {
        super(message);
    }
}
