package com.smartcampus.backend.dto.facilities;

public class StudyAreaOccupancyResponse {

    private String studyAreaId;
    private String hallName;
    private int activeUserCount;

    public StudyAreaOccupancyResponse() {
    }

    public StudyAreaOccupancyResponse(String studyAreaId, String hallName, int activeUserCount) {
        this.studyAreaId = studyAreaId;
        this.hallName = hallName;
        this.activeUserCount = activeUserCount;
    }

    public String getStudyAreaId() {
        return studyAreaId;
    }

    public void setStudyAreaId(String studyAreaId) {
        this.studyAreaId = studyAreaId;
    }

    public String getHallName() {
        return hallName;
    }

    public void setHallName(String hallName) {
        this.hallName = hallName;
    }

    public int getActiveUserCount() {
        return activeUserCount;
    }

    public void setActiveUserCount(int activeUserCount) {
        this.activeUserCount = activeUserCount;
    }
}
