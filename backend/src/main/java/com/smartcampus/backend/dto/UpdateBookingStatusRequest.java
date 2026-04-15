package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.BookingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for updating booking status by admin.
 * Used for approving, rejecting, or cancelling bookings.
 */
public class UpdateBookingStatusRequest {

    @NotNull(message = "Status is required")
    private BookingStatus status;

    @NotBlank(message = "Reason is required for status change")
    @Size(min = 5, max = 500, message = "Reason must be between 5 and 500 characters")
    private String reason;

    // Constructors
    public UpdateBookingStatusRequest() {}

    public UpdateBookingStatusRequest(BookingStatus status, String reason) {
        this.status = status;
        this.reason = reason;
    }

    // Getters and Setters
    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
