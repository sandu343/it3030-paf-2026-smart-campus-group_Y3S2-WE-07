package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.ResourceStatus;
import com.smartcampus.backend.model.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Pattern;

public class ResourceRequest {

    @NotNull(message = "Resource type is required")
    private ResourceType resourceType;

    @NotBlank(message = "Building is required")
    private String buildingId;

    @NotBlank(message = "Block name is required")
    @Pattern(regexp = "^[A-Z]$", message = "Block name must be a single uppercase English letter")
    private String blockName;

    @NotNull(message = "Floor number is required")
    @Min(value = 1, message = "Floor number must be greater than 0")
    private Integer floorNumber;

    @NotNull(message = "Hall number is required")
    @Min(value = 1, message = "Hall number must be greater than 0")
    @Max(value = 99, message = "Hall number must be 99 or less")
    private Integer hallNumber;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be greater than 0")
    private Integer capacity;

    @NotNull(message = "Status is required")
    private ResourceStatus status;

    private String description;

    private Double latitude;

    private Double longitude;

    private Integer mapRadiusMeters;

    @Min(value = 0, message = "Projector count cannot be negative")
    private Integer projectorCount;

    @Min(value = 0, message = "Camera count cannot be negative")
    private Integer cameraCount;

    @Min(value = 0, message = "PC count cannot be negative")
    private Integer pcCount;

    public ResourceRequest() {
    }

    public ResourceType getResourceType() {
        return resourceType;
    }

    public void setResourceType(ResourceType resourceType) {
        this.resourceType = resourceType;
    }

    public String getBuildingId() {
        return buildingId;
    }

    public void setBuildingId(String buildingId) {
        this.buildingId = buildingId;
    }

    public String getBlockName() {
        return blockName;
    }

    public void setBlockName(String blockName) {
        this.blockName = blockName;
    }

    public Integer getFloorNumber() {
        return floorNumber;
    }

    public void setFloorNumber(Integer floorNumber) {
        this.floorNumber = floorNumber;
    }

    public Integer getHallNumber() {
        return hallNumber;
    }

    public void setHallNumber(Integer hallNumber) {
        this.hallNumber = hallNumber;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public ResourceStatus getStatus() {
        return status;
    }

    public void setStatus(ResourceStatus status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Integer getMapRadiusMeters() {
        return mapRadiusMeters;
    }

    public void setMapRadiusMeters(Integer mapRadiusMeters) {
        this.mapRadiusMeters = mapRadiusMeters;
    }

    public Integer getProjectorCount() {
        return projectorCount;
    }

    public void setProjectorCount(Integer projectorCount) {
        this.projectorCount = projectorCount;
    }

    public Integer getCameraCount() {
        return cameraCount;
    }

    public void setCameraCount(Integer cameraCount) {
        this.cameraCount = cameraCount;
    }

    public Integer getPcCount() {
        return pcCount;
    }

    public void setPcCount(Integer pcCount) {
        this.pcCount = pcCount;
    }
}