package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.CampusAlertResponse;
import com.smartcampus.backend.dto.CreateCampusAlertRequest;
import com.smartcampus.backend.dto.UpdateCampusAlertRequest;
import com.smartcampus.backend.service.CampusAlertService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class CampusAlertController {

    private final CampusAlertService campusAlertService;

    public CampusAlertController(CampusAlertService campusAlertService) {
        this.campusAlertService = campusAlertService;
    }

    @PostMapping("/api/admin/campus-alerts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampusAlertResponse> createCampusAlert(@Valid @RequestBody CreateCampusAlertRequest request) {
        CampusAlertResponse response = campusAlertService.createAlert(request, getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/admin/campus-alerts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CampusAlertResponse>> getAdminCampusAlerts() {
        return ResponseEntity.ok(campusAlertService.getAdminAlerts());
    }

    @PutMapping("/api/admin/campus-alerts/{alertId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampusAlertResponse> updateCampusAlert(
            @PathVariable String alertId,
            @Valid @RequestBody UpdateCampusAlertRequest request) {
        return ResponseEntity.ok(campusAlertService.updateAlert(alertId, request));
    }

    @DeleteMapping("/api/admin/campus-alerts/{alertId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCampusAlert(@PathVariable String alertId) {
        campusAlertService.deleteAlert(alertId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/campus-alerts/active")
    public ResponseEntity<List<CampusAlertResponse>> getActiveCampusAlerts() {
        return ResponseEntity.ok(campusAlertService.getActiveAlerts());
    }

    private String getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}