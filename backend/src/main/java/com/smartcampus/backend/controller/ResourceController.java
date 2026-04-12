package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.ResourceResponse;
import com.smartcampus.backend.service.ResourceManagementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ResourceController {

    private final ResourceManagementService resourceManagementService;

    public ResourceController(ResourceManagementService resourceManagementService) {
        this.resourceManagementService = resourceManagementService;
    }

    /**
     * Get all available resources.
     * 
     * Optionally filter by resourceType, buildingId, status, and search keywords.
     * This endpoint is used to populate the booking form's resource dropdown.
     * 
     * @param resourceType optional: filter by resource type (CLASSROOM, LAB, MEETING_ROOM, etc.)
     * @param buildingId optional: filter by building
     * @param status optional: filter by status (AVAILABLE, MAINTENANCE, etc.)
     * @param search optional: search by hall name
     * @return list of resources matching filters
     * @status 200 OK
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ResourceResponse>> getResources(
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String buildingId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        
        List<ResourceResponse> resources = resourceManagementService.getResources(
                resourceType, buildingId, status, search);
        return ResponseEntity.ok(resources);
    }

    /**
     * Get a specific resource by ID.
     * 
     * Used to fetch detailed information about a resource.
     * 
     * @param id the resource ID
     * @return resource details
     * @status 200 OK
     * @status 404 NOT_FOUND if resource doesn't exist
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable String id) {
        ResourceResponse resource = resourceManagementService.getResourceById(id);
        return ResponseEntity.ok(resource);
    }
}
