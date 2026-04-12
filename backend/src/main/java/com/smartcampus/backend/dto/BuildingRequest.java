package com.smartcampus.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public class BuildingRequest {

    @NotBlank(message = "Building name is required")
    private String buildingName;

    @NotNull(message = "Block count is required")
    @Min(value = 1, message = "Block count must be greater than 0")
    private Integer blockCount;

    @NotEmpty(message = "At least one block is required")
    @Valid
    private List<BlockRequest> blocks;

    public BuildingRequest() {
    }

    public String getBuildingName() {
        return buildingName;
    }

    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
    }

    public Integer getBlockCount() {
        return blockCount;
    }

    public void setBlockCount(Integer blockCount) {
        this.blockCount = blockCount;
    }

    public List<BlockRequest> getBlocks() {
        return blocks;
    }

    public void setBlocks(List<BlockRequest> blocks) {
        this.blocks = blocks;
    }

    public static class BlockRequest {
        @NotBlank(message = "Block name is required")
        @Pattern(regexp = "^[A-Z]$", message = "Block name must be a single uppercase English letter")
        private String blockName;

        @NotNull(message = "Floor count is required")
        @Min(value = 1, message = "Floor count must be greater than 0")
        private Integer floorCount;

        public BlockRequest() {
        }

        public String getBlockName() {
            return blockName;
        }

        public void setBlockName(String blockName) {
            this.blockName = blockName;
        }

        public Integer getFloorCount() {
            return floorCount;
        }

        public void setFloorCount(Integer floorCount) {
            this.floorCount = floorCount;
        }
    }
}