package com.smartcampus.backend.exception;

public class TicketStatusTransitionException extends RuntimeException {
    public TicketStatusTransitionException(String message) {
        super(message);
    }
}
