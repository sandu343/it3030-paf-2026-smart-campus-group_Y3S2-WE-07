package com.smartcampus.backend.exception;

public class DuplicateBuildingNameException extends RuntimeException {
    public DuplicateBuildingNameException(String message) {
        super(message);
    }
}