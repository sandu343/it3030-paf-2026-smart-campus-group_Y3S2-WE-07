package com.smartcampus.backend.dto;

import java.time.LocalTime;

/**
 * DTO representing an available time slot for a resource.
 * Used in smart suggestion feature to show when a resource is free.
 */
public class AvailableSlotResponse {

    private LocalTime startTime;
    private LocalTime endTime;
    private String description;  // e.g., "Available from 2:00 PM to 3:30 PM"

    // Constructors
    public AvailableSlotResponse() {}

    public AvailableSlotResponse(LocalTime startTime, LocalTime endTime, String description) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.description = description;
    }

    // Getters and Setters
    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public String toString() {
        return "AvailableSlotResponse{" +
                "startTime=" + startTime +
                ", endTime=" + endTime +
                ", description='" + description + '\'' +
                '}';
    }
}
