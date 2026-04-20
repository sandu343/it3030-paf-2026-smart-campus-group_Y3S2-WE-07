package com.smartcampus.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class BuildingResponse {
    private String id;
    private String buildingName;
    private int blockCount;
    private List<BlockResponse> blocks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BuildingResponse() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBuildingName() {
        return buildingName;
    }

    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
    }

    public int getBlockCount() {
        return blockCount;
    }

    public void setBlockCount(int blockCount) {
        this.blockCount = blockCount;
    }

    public List<BlockResponse> getBlocks() {
        return blocks;
    }

    public void setBlocks(List<BlockResponse> blocks) {
        this.blocks = blocks;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static class BlockResponse {
        private String blockName;
        private int floorCount;

        public BlockResponse() {
        }

        public String getBlockName() {
            return blockName;
        }

        public void setBlockName(String blockName) {
            this.blockName = blockName;
        }

        public int getFloorCount() {
            return floorCount;
        }

        public void setFloorCount(int floorCount) {
            this.floorCount = floorCount;
        }
    }
}