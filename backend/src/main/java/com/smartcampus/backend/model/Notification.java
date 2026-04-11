package com.smartcampus.backend.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;

    @Indexed
    private String userId;

    private String title;

    private NotificationType type;

    private String message;

    private NotificationStatus status;

    private String relatedBookingId;

    @CreatedDate
    private Instant createdAt;

    // Constructors
    public Notification() {
    }

    public Notification(String id, String userId, String title, NotificationType type, String message,
            NotificationStatus status, String relatedBookingId, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.type = type;
        this.message = message;
        this.status = status;
        this.relatedBookingId = relatedBookingId;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationStatus status) {
        this.status = status;
    }

    public Boolean getIsRead() {
        return status == NotificationStatus.READ;
    }

    public void setIsRead(Boolean isRead) {
        this.status = Boolean.TRUE.equals(isRead) ? NotificationStatus.READ : NotificationStatus.UNREAD;
    }

    public String getRelatedBookingId() {
        return relatedBookingId;
    }

    public void setRelatedBookingId(String relatedBookingId) {
        this.relatedBookingId = relatedBookingId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
