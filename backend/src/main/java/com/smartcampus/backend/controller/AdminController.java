package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.BuildingRequest;
import com.smartcampus.backend.dto.BuildingResponse;
import com.smartcampus.backend.dto.CreateTechnicianRequest;
import com.smartcampus.backend.dto.ResourceRequest;
import com.smartcampus.backend.dto.ResourceResponse;
import com.smartcampus.backend.dto.StaffResponse;
import com.smartcampus.backend.dto.UpdateTechnicianRequest;
import com.smartcampus.backend.service.BuildingManagementService;
import com.smartcampus.backend.service.ResourceManagementService;
import com.smartcampus.backend.service.StaffManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class AdminController {

    private final StaffManagementService staffManagementService;
    private final BuildingManagementService buildingManagementService;
    private final ResourceManagementService resourceManagementService;

    public AdminController(StaffManagementService staffManagementService,
            BuildingManagementService buildingManagementService,
            ResourceManagementService resourceManagementService) {
        this.staffManagementService = staffManagementService;
        this.buildingManagementService = buildingManagementService;
        this.resourceManagementService = resourceManagementService;
    }

    @PostMapping("/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StaffResponse> createTechnician(
            @Valid @RequestBody CreateTechnicianRequest request,
            Authentication authentication) {
        StaffResponse response = staffManagementService.createTechnician(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StaffResponse>> getAllTechnicians() {
        return ResponseEntity.ok(staffManagementService.getAllTechnicians());
    }

    @GetMapping("/technicians/check-username")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> checkUsernameAvailability(@RequestParam String username) {
        boolean available = staffManagementService.isUsernameAvailable(username);
        return ResponseEntity.ok(Map.of(
                "username", username,
                "available", available));
    }

    @PutMapping("/technicians/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StaffResponse> updateTechnician(
            @PathVariable String id,
            @Valid @RequestBody UpdateTechnicianRequest request) {
        return ResponseEntity.ok(staffManagementService.updateTechnician(id, request));
    }

    @DeleteMapping("/technicians/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateTechnician(@PathVariable String id) {
        staffManagementService.deactivateTechnician(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/buildings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BuildingResponse> createBuilding(@Valid @RequestBody BuildingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(buildingManagementService.createBuilding(request));
    }

    @GetMapping("/buildings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BuildingResponse>> getAllBuildings() {
        return ResponseEntity.ok(buildingManagementService.getAllBuildings());
    }

    @GetMapping("/buildings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BuildingResponse> getBuildingById(@PathVariable String id) {
        return ResponseEntity.ok(buildingManagementService.getBuildingById(id));
    }

    @PutMapping("/buildings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BuildingResponse> updateBuilding(
            @PathVariable String id,
            @Valid @RequestBody BuildingRequest request) {
        return ResponseEntity.ok(buildingManagementService.updateBuilding(id, request));
    }

    @DeleteMapping("/buildings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBuilding(@PathVariable String id) {
        buildingManagementService.deleteBuilding(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/buildings/check-name")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> checkBuildingName(@RequestParam String buildingName) {
        boolean available = buildingManagementService.isBuildingNameAvailable(buildingName);
        return ResponseEntity.ok(Map.of("buildingName", buildingName, "available", available));
    }

    @PostMapping("/resources")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> createResource(@Valid @RequestBody ResourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceManagementService.createResource(request));
    }

    @GetMapping("/resources")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ResourceResponse>> getResources(
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String buildingId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(resourceManagementService.getResources(resourceType, buildingId, status, search));
    }

    @GetMapping("/resources/filter")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ResourceResponse>> filterResources(
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String buildingId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(resourceManagementService.getResources(resourceType, buildingId, status, search));
    }

    @GetMapping("/resources/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable String id) {
        return ResponseEntity.ok(resourceManagementService.getResourceById(id));
    }

    @PutMapping("/resources/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable String id,
            @Valid @RequestBody ResourceRequest request) {
        return ResponseEntity.ok(resourceManagementService.updateResource(id, request));
    }

    @DeleteMapping("/resources/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        resourceManagementService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resources/check-hall-name")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> checkHallName(@RequestParam String hallName) {
        boolean available = resourceManagementService.isHallNameAvailable(hallName);
        return ResponseEntity.ok(Map.of("hallName", hallName, "available", available));
    }
}
