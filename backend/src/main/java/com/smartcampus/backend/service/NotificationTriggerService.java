package com.smartcampus.backend.service;

import com.smartcampus.backend.model.NotificationType;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class NotificationTriggerService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationTriggerService(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public void triggerBookingCreatedNotification(String bookingId, String resourceName, LocalDate bookingDate,
            String requesterName) {
        notifyAdmins(
                "New Booking Request",
                NotificationType.BOOKING_CREATED,
                "New booking request from " + requesterName + " for " + resourceName + " on " + formatDate(bookingDate)
                        + ".",
                bookingId);
    }

    public void triggerAdminTicketCreatedNotification(String ticketId, String ticketTitle, String requesterName) {
        notifyAdmins(
                "New Ticket Request",
                NotificationType.TICKET_CREATED,
                "New ticket created by " + requesterName + ": " + ticketTitle + " (ID: " + ticketId + ")",
                null);
    }

    public void triggerBookingApprovedNotification(String userId, String bookingId, String resourceName,
            LocalDate bookingDate) {
        notificationService.createNotification(
                userId,
                "Booking Approved",
                NotificationType.valueOf("BOOKING_APPROVED"),
                bookingId,
                "Your booking for " + resourceName + " on " + formatDate(bookingDate) + " has been approved.",
                null);
    }

    public void triggerBookingRejectedNotification(String userId, String bookingId, String resourceName,
            LocalDate bookingDate, String rejectionReason) {
        notificationService.createNotification(
                userId,
                "Booking Rejected",
                NotificationType.BOOKING_REJECTED,
                bookingId,
                "Your booking for " + resourceName + " on " + formatDate(bookingDate) + " has been rejected. " +
                        (rejectionReason != null && !rejectionReason.isBlank() ? "Reason: " + rejectionReason : ""),
                null);
    }

    public void triggerTicketCreatedNotification(String userId, String ticketId, String ticketTitle) {
        notificationService.createNotification(
                userId,
                "Ticket Created",
                NotificationType.TICKET_CREATED,
                null,
                "Your ticket (ID: " + ticketId + ") has been created: " + ticketTitle,
                null);
    }

    public void triggerTicketAssignedNotification(String userId, String ticketId, String ticketTitle) {
        notificationService.createNotification(
                userId,
                "Ticket Assigned",
                NotificationType.TICKET_ASSIGNED,
                null,
                "You have been assigned a new ticket (ID: " + ticketId + "): " + ticketTitle,
                null);
    }

    public void triggerTicketAssignmentUpdatedNotification(String userId, String ticketId, String ticketTitle,
            String assigneeName) {
        notificationService.createNotification(
                userId,
                "Ticket Assigned",
                NotificationType.TICKET_ASSIGNED,
                null,
                "Your ticket (ID: " + ticketId + ") has been assigned to " + assigneeName + ": " + ticketTitle,
                null);
    }

    public void triggerTicketStatusUpdatedNotification(String userId, String ticketId, String ticketTitle,
            String newStatus) {
        notificationService.createNotification(
                userId,
                "Ticket Status Updated",
                NotificationType.TICKET_STATUS_UPDATED,
                null,
                "Your ticket (ID: " + ticketId + ") status has been updated to: " + newStatus,
                null);
    }

    public void triggerTicketCommentAddedNotification(String userId, String ticketId, String ticketTitle,
            String commenterName) {
        notificationService.createNotification(
                userId,
                "Ticket Comment Added",
                NotificationType.COMMENT_ADDED,
                null,
                commenterName + " added a comment to your ticket (ID: " + ticketId + "): " + ticketTitle,
                null);
    }

    public void triggerCommentAddedNotification(String userId, String ticketId, String ticketTitle) {
        notificationService.createNotification(
                userId,
                "Comment Added",
                NotificationType.COMMENT_ADDED,
                null,
                "A new comment has been added to your ticket (ID: " + ticketId + "): " + ticketTitle,
                null);
    }

    private String formatDate(LocalDate date) {
        return date == null ? "your booking date" : date.format(DateTimeFormatter.ofPattern("MMM d, yyyy"));
    }

    private void notifyAdmins(String title, NotificationType type, String message, String relatedBookingId) {
        List<User> adminUsers = userRepository.findAllByRole(Role.ADMIN);

        for (User admin : adminUsers) {
            if (admin.getId() == null) {
                continue;
            }

            notificationService.createNotification(
                    admin.getId(),
                    title,
                    type,
                    relatedBookingId,
                    message,
                    null);
        }
    }
}
