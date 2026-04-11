package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.BuildingRequest;
import com.smartcampus.backend.dto.BuildingResponse;
import com.smartcampus.backend.exception.BuildingNotFoundException;
import com.smartcampus.backend.exception.DuplicateBuildingNameException;
import com.smartcampus.backend.exception.ValidationException;
import com.smartcampus.backend.model.Building;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.repository.BuildingRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BuildingManagementService {

    private final BuildingRepository buildingRepository;
    private final ResourceRepository resourceRepository;

    public BuildingManagementService(BuildingRepository buildingRepository, ResourceRepository resourceRepository) {
        this.buildingRepository = buildingRepository;
        this.resourceRepository = resourceRepository;
    }

    public BuildingResponse createBuilding(BuildingRequest request) {
        String buildingName = normalizeName(request.getBuildingName());
        validateBuildingPayload(buildingName, request.getBlockCount(), request.getBlocks());

        if (buildingRepository.existsByBuildingNameIgnoreCase(buildingName)) {
            throw new DuplicateBuildingNameException("Building name '" + buildingName + "' already exists");
        }

        Building building = new Building();
        building.setBuildingName(buildingName);
        building.setBlockCount(request.getBlockCount());
        building.setBlocks(mapBlocks(request.getBlocks()));
        building.setCreatedAt(LocalDateTime.now());
        building.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(buildingRepository.save(building));
    }

    public List<BuildingResponse> getAllBuildings() {
        return buildingRepository.findAll().stream()
            .sorted(Comparator.comparing(Building::getBuildingName, String.CASE_INSENSITIVE_ORDER))
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    public BuildingResponse getBuildingById(String id) {
        return mapToResponse(findBuildingOrThrow(id));
    }

    public BuildingResponse updateBuilding(String id, BuildingRequest request) {
        Building building = findBuildingOrThrow(id);
        String updatedName = normalizeName(request.getBuildingName());
        validateBuildingPayload(updatedName, request.getBlockCount(), request.getBlocks());

        boolean nameChanged = !building.getBuildingName().equalsIgnoreCase(updatedName);
        if (nameChanged && buildingRepository.existsByBuildingNameIgnoreCase(updatedName)) {
            throw new DuplicateBuildingNameException("Building name '" + updatedName + "' already exists");
        }

        validateExistingResourcesAgainstUpdatedBlocks(id, request.getBlocks());

        building.setBuildingName(updatedName);
        building.setBlockCount(request.getBlockCount());
        building.setBlocks(mapBlocks(request.getBlocks()));
        building.setUpdatedAt(LocalDateTime.now());

        Building saved = buildingRepository.save(building);

        if (nameChanged) {
            List<Resource> resources = resourceRepository.findByBuildingId(saved.getId());
            for (Resource resource : resources) {
                resource.setBuildingName(saved.getBuildingName());
                resource.setUpdatedAt(LocalDateTime.now());
            }
            resourceRepository.saveAll(resources);
        }

        return mapToResponse(saved);
    }

    public void deleteBuilding(String id) {
        Building building = findBuildingOrThrow(id);
        if (resourceRepository.existsByBuildingId(building.getId())) {
            throw new ValidationException("Cannot delete building because resources already exist under it");
        }
        buildingRepository.delete(building);
    }

    public boolean isBuildingNameAvailable(String buildingName) {
        if (buildingName == null || buildingName.trim().isEmpty()) {
            return false;
        }
        return !buildingRepository.existsByBuildingNameIgnoreCase(buildingName.trim());
    }

    public Building findBuildingOrThrow(String id) {
        return buildingRepository.findById(id)
            .orElseThrow(() -> new BuildingNotFoundException("Building not found"));
    }

    private void validateBuildingPayload(String buildingName, Integer blockCount, List<BuildingRequest.BlockRequest> blocks) {
        if (blockCount == null || blockCount < 1) {
            throw new ValidationException("Block count must be greater than 0");
        }
        if (blocks == null || blocks.isEmpty()) {
            throw new ValidationException("At least one block is required");
        }
        if (blocks.size() != blockCount) {
            throw new ValidationException("Number of blocks entered must match block count");
        }

        Set<String> seenBlocks = new HashSet<>();
        for (BuildingRequest.BlockRequest block : blocks) {
            String blockName = block.getBlockName() == null ? "" : block.getBlockName().trim().toUpperCase();
            if (!blockName.matches("^[A-Z]$")) {
                throw new ValidationException("Block name must be a single uppercase English letter");
            }
            if (!seenBlocks.add(blockName)) {
                throw new ValidationException("Duplicate block name '" + blockName + "' found in the same building");
            }
            if (block.getFloorCount() == null || block.getFloorCount() < 1) {
                throw new ValidationException("Floor count must be greater than 0 for block '" + blockName + "'");
            }
        }
    }

    private void validateExistingResourcesAgainstUpdatedBlocks(String buildingId, List<BuildingRequest.BlockRequest> blocks) {
        Map<String, Integer> floorCounts = new HashMap<>();
        for (BuildingRequest.BlockRequest block : blocks) {
            floorCounts.put(block.getBlockName().trim().toUpperCase(), block.getFloorCount());
        }

        for (Resource resource : resourceRepository.findByBuildingId(buildingId)) {
            Integer floorCount = floorCounts.get(resource.getBlockName().trim().toUpperCase());
            if (floorCount == null) {
                throw new ValidationException(
                    "Cannot update building because resource '" + resource.getHallName() + "' uses block '" + resource.getBlockName() + "'"
                );
            }
            if (resource.getFloorNumber() > floorCount) {
                throw new ValidationException(
                    "Cannot update building because resource '" + resource.getHallName() + "' exceeds the new floor count for block '" + resource.getBlockName() + "'"
                );
            }
        }
    }

    private List<Building.Block> mapBlocks(List<BuildingRequest.BlockRequest> blocks) {
        return blocks.stream().map(block -> {
            Building.Block entity = new Building.Block();
            entity.setBlockName(block.getBlockName().trim().toUpperCase());
            entity.setFloorCount(block.getFloorCount());
            return entity;
        }).collect(Collectors.toList());
    }

    private BuildingResponse mapToResponse(Building building) {
        BuildingResponse response = new BuildingResponse();
        response.setId(building.getId());
        response.setBuildingName(building.getBuildingName());
        response.setBlockCount(building.getBlockCount());
        response.setBlocks(building.getBlocks() == null ? List.of() : building.getBlocks().stream().map(block -> {
            BuildingResponse.BlockResponse blockResponse = new BuildingResponse.BlockResponse();
            blockResponse.setBlockName(block.getBlockName());
            blockResponse.setFloorCount(block.getFloorCount());
            return blockResponse;
        }).collect(Collectors.toList()));
        response.setCreatedAt(building.getCreatedAt());
        response.setUpdatedAt(building.getUpdatedAt());
        return response;
    }

    private String normalizeName(String value) {
        if (value == null) {
            return null;
        }
        return value.trim().replaceAll("\\s+", " ");
    }
}