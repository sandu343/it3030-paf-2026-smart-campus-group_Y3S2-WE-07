package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Notification;
import com.smartcampus.backend.model.NotificationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, NotificationStatus status);

    Optional<Notification> findByIdAndUserId(String id, String userId);

    long deleteByUserId(String userId);

    long countByUserIdAndStatus(String userId, NotificationStatus status);
}
