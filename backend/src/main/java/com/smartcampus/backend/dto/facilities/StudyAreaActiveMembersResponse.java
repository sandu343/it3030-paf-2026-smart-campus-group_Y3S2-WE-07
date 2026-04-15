package com.smartcampus.backend.dto.facilities;

import java.util.List;

public class StudyAreaActiveMembersResponse {

    private String studyAreaId;
    private String hallName;
    private List<ActiveMemberPin> activeMembers;

    public StudyAreaActiveMembersResponse() {
    }

    public StudyAreaActiveMembersResponse(String studyAreaId, String hallName, List<ActiveMemberPin> activeMembers) {
        this.studyAreaId = studyAreaId;
        this.hallName = hallName;
        this.activeMembers = activeMembers;
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

    public List<ActiveMemberPin> getActiveMembers() {
        return activeMembers;
    }

    public void setActiveMembers(List<ActiveMemberPin> activeMembers) {
        this.activeMembers = activeMembers;
    }

    public static class ActiveMemberPin {
        private String userId;
        private String userName;
        private double latitude;
        private double longitude;

        public ActiveMemberPin() {
        }

        public ActiveMemberPin(String userId, String userName, double latitude, double longitude) {
            this.userId = userId;
            this.userName = userName;
            this.latitude = latitude;
            this.longitude = longitude;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getUserName() {
            return userName;
        }

        public void setUserName(String userName) {
            this.userName = userName;
        }

        public double getLatitude() {
            return latitude;
        }

        public void setLatitude(double latitude) {
            this.latitude = latitude;
        }

        public double getLongitude() {
            return longitude;
        }

        public void setLongitude(double longitude) {
            this.longitude = longitude;
        }
    }
}
