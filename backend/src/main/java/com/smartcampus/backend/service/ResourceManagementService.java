package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.ResourceRequest;
import com.smartcampus.backend.dto.ResourceResponse;
import com.smartcampus.backend.exception.BuildingNotFoundException;
import com.smartcampus.backend.exception.DuplicateHallNameException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.exception.ValidationException;
import com.smartcampus.backend.model.Building;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceStatus;
import com.smartcampus.backend.model.ResourceType;
import com.smartcampus.backend.repository.BuildingRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import org.springframework.stereotype.Service;
   
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ResourceManagementService {

    private final ResourceRepository resourceRepository;
    private final BuildingRepository buildingRepository;

    public ResourceManagementService(ResourceRepository resourceRepository, BuildingRepository buildingRepository) {
        this.resourceRepository = resourceRepository;
        this.buildingRepository = buildingRepository;
    }

    public ResourceResponse createResource(ResourceRequest request) {
        Building building = findBuilding(request.getBuildingId());
        validateResourceRequest(request, building);

        String hallName = generateHallName(request.getBlockName(), request.getFloorNumber(), request.getHallNumber());
        if (resourceRepository.existsByHallNameIgnoreCase(hallName)) {
            throw new DuplicateHallNameException("Hall name '" + hallName + "' already exists");
        }

        Resource resource = new Resource();
        resource.setResourceType(request.getResourceType());
        resource.setBuildingId(building.getId());
        resource.setBuildingName(building.getBuildingName());
        resource.setBlockName(normalizeBlockName(request.getBlockName()));
        resource.setFloorNumber(request.getFloorNumber());
        resource.setHallNumber(request.getHallNumber());
        resource.setHallName(hallName);
        resource.setCapacity(request.getCapacity());
        resource.setStatus(request.getStatus());
        resource.setDescription(request.getDescription());
        resource.setLatitude(request.getResourceType() == ResourceType.STUDY_AREA ? request.getLatitude() : null);
        resource.setLongitude(request.getResourceType() == ResourceType.STUDY_AREA ? request.getLongitude() : null);
        resource.setMapRadiusMeters(
                request.getResourceType() == ResourceType.STUDY_AREA ? request.getMapRadiusMeters() : null);
        resource.setProjectorCount(normalizeEquipmentCount(request.getProjectorCount()));
        resource.setCameraCount(normalizeEquipmentCount(request.getCameraCount()));
        resource.setPcCount(normalizeEquipmentCount(request.getPcCount()));
        resource.setCreatedAt(LocalDateTime.now());
        resource.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(resourceRepository.save(resource));
    }

    public List<ResourceResponse> getResources(String resourceType, String buildingId, String status, String search) {
        ResourceType parsedResourceType = parseResourceType(resourceType);
        ResourceStatus parsedStatus = parseResourceStatus(status);
        String normalizedSearch = search == null ? null : search.trim().toLowerCase();

        return resourceRepository.findAll().stream()
                .filter(resource -> parsedResourceType == null || resource.getResourceType() == parsedResourceType)
                .filter(resource -> buildingId == null || buildingId.isBlank()
                        || resource.getBuildingId().equals(buildingId))
                .filter(resource -> parsedStatus == null || resource.getStatus() == parsedStatus)
                .filter(resource -> normalizedSearch == null || normalizedSearch.isBlank()
                        || matchesSearch(resource, normalizedSearch))
                .sorted(Comparator.comparing(Resource::getHallName, String.CASE_INSENSITIVE_ORDER))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ResourceResponse getResourceById(String id) {
        return mapToResponse(findResourceOrThrow(id));
    }

    public ResourceResponse updateResource(String id, ResourceRequest request) {
        Resource existing = findResourceOrThrow(id);
        Building building = findBuilding(request.getBuildingId());
        validateResourceRequest(request, building);

        String hallName = generateHallName(request.getBlockName(), request.getFloorNumber(), request.getHallNumber());
        Optional<Resource> hallConflict = resourceRepository.findByHallNameIgnoreCase(hallName);
        if (hallConflict.isPresent() && !hallConflict.get().getId().equals(existing.getId())) {
            throw new DuplicateHallNameException("Hall name '" + hallName + "' already exists");
        }

        existing.setResourceType(request.getResourceType());
        existing.setBuildingId(building.getId());
        existing.setBuildingName(building.getBuildingName());
        existing.setBlockName(normalizeBlockName(request.getBlockName()));
        existing.setFloorNumber(request.getFloorNumber());
        existing.setHallNumber(request.getHallNumber());
        existing.setHallName(hallName);
        existing.setCapacity(request.getCapacity());
        existing.setStatus(request.getStatus());
        existing.setDescription(request.getDescription());
        existing.setLatitude(request.getResourceType() == ResourceType.STUDY_AREA ? request.getLatitude() : null);
        existing.setLongitude(request.getResourceType() == ResourceType.STUDY_AREA ? request.getLongitude() : null);
        existing.setMapRadiusMeters(
                request.getResourceType() == ResourceType.STUDY_AREA ? request.getMapRadiusMeters() : null);
        existing.setProjectorCount(normalizeEquipmentCount(request.getProjectorCount()));
        existing.setCameraCount(normalizeEquipmentCount(request.getCameraCount()));
        existing.setPcCount(normalizeEquipmentCount(request.getPcCount()));
        existing.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(resourceRepository.save(existing));
    }

    public void deleteResource(String id) {
        Resource resource = findResourceOrThrow(id);
        resourceRepository.delete(resource);
    }

    public boolean isHallNameAvailable(String hallName) {
        if (hallName == null || hallName.trim().isEmpty()) {
            return false;
        }
        return !resourceRepository.existsByHallNameIgnoreCase(hallName.trim());
    }

    public Resource findResourceOrThrow(String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
    }

    private void validateResourceRequest(ResourceRequest request, Building building) {
        if (request.getBlockName() == null || !request.getBlockName().trim().matches("^[A-Z]$")) {
            throw new ValidationException("Block name must be a single uppercase English letter");
        }
        if (request.getFloorNumber() == null || request.getFloorNumber() < 1) {
            throw new ValidationException("Floor number must be greater than 0");
        }
        if (request.getHallNumber() == null || request.getHallNumber() < 1) {
            throw new ValidationException("Hall number must be greater than 0");
        }
        if (request.getCapacity() == null || request.getCapacity() < 1) {
            throw new ValidationException("Capacity must be greater than 0");
        }

        if (request.getProjectorCount() != null && request.getProjectorCount() < 0) {
            throw new ValidationException("Projector count cannot be negative");
        }
        if (request.getCameraCount() != null && request.getCameraCount() < 0) {
            throw new ValidationException("Camera count cannot be negative");
        }
        if (request.getPcCount() != null && request.getPcCount() < 0) {
            throw new ValidationException("PC count cannot be negative");
        }

        Building.Block block = building.getBlocks().stream()
                .filter(item -> item.getBlockName().equalsIgnoreCase(request.getBlockName().trim()))
                .findFirst()
                .orElseThrow(() -> new ValidationException("Selected block does not exist in the selected building"));

        if (request.getFloorNumber() > block.getFloorCount()) {
            throw new ValidationException("Floor number cannot exceed the selected block's floor count");
        }

        if (request.getResourceType() == ResourceType.STUDY_AREA) {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                throw new ValidationException("Latitude and longitude are required for study areas");
            }
            if (request.getLatitude() < -90 || request.getLatitude() > 90) {
                throw new ValidationException("Latitude must be between -90 and 90");
            }
            if (request.getLongitude() < -180 || request.getLongitude() > 180) {
                throw new ValidationException("Longitude must be between -180 and 180");
            }
            if (request.getMapRadiusMeters() == null || request.getMapRadiusMeters() < 1) {
                throw new ValidationException("Radius must be greater than 0 for study areas");
            }
        }
    }

    private Building findBuilding(String buildingId) {
        if (buildingId == null || buildingId.trim().isEmpty()) {
            throw new ValidationException("Building is required");
        }
        return buildingRepository.findById(buildingId)
                .orElseThrow(() -> new BuildingNotFoundException("Selected building not found"));
    }

    private ResourceResponse mapToResponse(Resource resource) {
        ResourceResponse response = new ResourceResponse();
        response.setId(resource.getId());
        response.setResourceType(resource.getResourceType());
        response.setBuildingId(resource.getBuildingId());
        response.setBuildingName(resource.getBuildingName());
        response.setBlockName(resource.getBlockName());
        response.setFloorNumber(resource.getFloorNumber());
        response.setHallNumber(resource.getHallNumber());
        response.setHallName(resource.getHallName());
        response.setCapacity(resource.getCapacity());
        response.setStatus(resource.getStatus());
        response.setDescription(resource.getDescription());
        response.setLatitude(resource.getLatitude());
        response.setLongitude(resource.getLongitude());
        response.setMapRadiusMeters(resource.getMapRadiusMeters());
        response.setProjectorCount(resource.getProjectorCount());
        response.setCameraCount(resource.getCameraCount());
        response.setPcCount(resource.getPcCount());
        response.setCreatedAt(resource.getCreatedAt());
        response.setUpdatedAt(resource.getUpdatedAt());
        return response;
    }

    private String generateHallName(String blockName, int floorNumber, int hallNumber) {
        return normalizeBlockName(blockName) + String.format("%02d%02d", floorNumber, hallNumber);
    }

    private String normalizeBlockName(String blockName) {
        return blockName.trim().toUpperCase();
    }

    private ResourceType parseResourceType(String resourceType) {
        if (resourceType == null || resourceType.isBlank()) {
            return null;
        }
        try {
            return ResourceType.fromValue(resourceType);
        } catch (IllegalArgumentException ex) {
            throw new ValidationException("Invalid resource type value");
        }
    }

    private ResourceStatus parseResourceStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return ResourceStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ValidationException("Invalid resource status value");
        }
    }

    private boolean matchesSearch(Resource resource, String normalizedSearch) {
        return contains(resource.getHallName(), normalizedSearch)
                || contains(resource.getBuildingName(), normalizedSearch)
                || contains(resource.getBlockName(), normalizedSearch)
                || contains(resource.getDescription(), normalizedSearch)
                || contains(resource.getResourceType() == null ? null : resource.getResourceType().name(),
                        normalizedSearch)
                || contains(resource.getStatus() == null ? null : resource.getStatus().name(), normalizedSearch)
                || contains(resource.getCapacity() > 0 ? String.valueOf(resource.getCapacity()) : null,
                        normalizedSearch);
    }

    private boolean contains(String value, String normalizedSearch) {
        return value != null && value.toLowerCase().contains(normalizedSearch);
    }

    private Integer normalizeEquipmentCount(Integer count) {
        return count == null ? 0 : count;
    }
}