package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.CampusAlertResponse;
import com.smartcampus.backend.dto.CreateCampusAlertRequest;
import com.smartcampus.backend.dto.UpdateCampusAlertRequest;
import com.smartcampus.backend.exception.CampusAlertNotFoundException;
import com.smartcampus.backend.exception.ValidationException;
import com.smartcampus.backend.model.CampusAlert;
import com.smartcampus.backend.repository.CampusAlertRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
public class CampusAlertService {

    private final CampusAlertRepository campusAlertRepository;

    public CampusAlertService(CampusAlertRepository campusAlertRepository) {
        this.campusAlertRepository = campusAlertRepository;
    }

    public CampusAlertResponse createAlert(CreateCampusAlertRequest request, String createdBy) {
        validateWindow(request.getPublishAt(), request.getEndAt());

        CampusAlert alert = new CampusAlert();
        alert.setMessage(request.getMessage().trim());
        alert.setPublishAt(request.getPublishAt());
        alert.setEndAt(request.getEndAt());
        alert.setActive(true);
        alert.setCreatedBy(createdBy);
        alert.setCreatedAt(Instant.now());
        alert.setUpdatedAt(Instant.now());

        return toResponse(campusAlertRepository.save(alert));
    }

    public List<CampusAlertResponse> getAdminAlerts() {
        return campusAlertRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<CampusAlertResponse> getActiveAlerts() {
        Instant now = Instant.now();
        return campusAlertRepository
                .findByActiveTrueAndPublishAtLessThanEqualAndEndAtGreaterThanOrderByPublishAtAsc(now, now)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CampusAlertResponse updateAlert(String alertId, UpdateCampusAlertRequest request) {
        validateWindow(request.getPublishAt(), request.getEndAt());

        String safeAlertId = Objects.requireNonNull(alertId, "Alert id is required");

        CampusAlert alert = campusAlertRepository.findById(safeAlertId)
                .orElseThrow(() -> new CampusAlertNotFoundException("Campus alert not found"));

        alert.setMessage(request.getMessage().trim());
        alert.setPublishAt(request.getPublishAt());
        alert.setEndAt(request.getEndAt());
        if (request.getActive() != null) {
            alert.setActive(request.getActive());
        }
        alert.setUpdatedAt(Instant.now());

        return toResponse(campusAlertRepository.save(alert));
    }

    public void deleteAlert(String alertId) {
        String safeAlertId = Objects.requireNonNull(alertId, "Alert id is required");
        CampusAlert alert = campusAlertRepository.findById(safeAlertId)
                .orElseThrow(() -> new CampusAlertNotFoundException("Campus alert not found"));
        campusAlertRepository.deleteById(Objects.requireNonNull(alert.getId(), "Campus alert id cannot be null"));
    }

    private void validateWindow(Instant publishAt, Instant endAt) {
        if (!endAt.isAfter(publishAt)) {
            throw new ValidationException("End time must be after publish time");
        }
    }

    private CampusAlertResponse toResponse(CampusAlert alert) {
        CampusAlertResponse response = new CampusAlertResponse();
        response.setId(alert.getId());
        response.setMessage(alert.getMessage());
        response.setPublishAt(alert.getPublishAt());
        response.setEndAt(alert.getEndAt());
        response.setActive(alert.isActive());
        response.setCreatedBy(alert.getCreatedBy());
        response.setCreatedAt(alert.getCreatedAt());
        response.setUpdatedAt(alert.getUpdatedAt());
        return response;
    }
}
