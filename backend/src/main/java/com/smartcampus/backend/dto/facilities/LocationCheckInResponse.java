package com.smartcampus.backend.dto.facilities;

public class LocationCheckInResponse {

    private String message;
    private int expiresInSeconds;
    private int activeUsers;

    public LocationCheckInResponse() {
    }

    public LocationCheckInResponse(String message, int expiresInSeconds, int activeUsers) {
        this.message = message;
        this.expiresInSeconds = expiresInSeconds;
        this.activeUsers = activeUsers;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public void setExpiresInSeconds(int expiresInSeconds) {
        this.expiresInSeconds = expiresInSeconds;
    }

    public int getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(int activeUsers) {
        this.activeUsers = activeUsers;
    }
}
