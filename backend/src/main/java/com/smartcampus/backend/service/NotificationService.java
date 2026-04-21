package com.smartcampus.backend.service;

import com.smartcampus.backend.model.Notification;
import com.smartcampus.backend.model.NotificationStatus;
import com.smartcampus.backend.model.NotificationType;
import com.smartcampus.backend.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification createNotification(String userId, NotificationType type, String message) {
        return createNotification(userId, null, type, null, message, null);
    }

    public Notification createNotification(
            String userId,
            String title,
            NotificationType type,
            String relatedBookingId,
            String message,
            NotificationStatus status) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setType(type);
        notification.setMessage(message);
        notification.setStatus(status == null ? NotificationStatus.UNREAD : status);
        notification.setRelatedBookingId(relatedBookingId);
        notification.setCreatedAt(Instant.now());

        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Notification markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        notification.setStatus(NotificationStatus.READ);
        return notificationRepository.save(notification);
    }

    public Notification markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        notification.setStatus(NotificationStatus.READ);
        return notificationRepository.save(notification);
    }

    public long markAllAsRead(String userId) {
        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndStatusOrderByCreatedAtDesc(userId, NotificationStatus.UNREAD);

        if (unreadNotifications.isEmpty()) {
            return 0;
        }

        List<Notification> updatedNotifications = new ArrayList<>();
        for (Notification notification : unreadNotifications) {
            notification.setStatus(NotificationStatus.READ);
            updatedNotifications.add(notification);
        }

        notificationRepository.saveAll(updatedNotifications);
        return updatedNotifications.size();
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
    }
}
