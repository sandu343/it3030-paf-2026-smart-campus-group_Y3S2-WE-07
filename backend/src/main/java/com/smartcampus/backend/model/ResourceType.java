package com.smartcampus.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum ResourceType {
    LECTURE_HALL,
    LAB,
    MEETING_ROOM,
    STUDY_AREA

    ;

    @JsonCreator
    public static ResourceType fromValue(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Resource type is required");
        }

        String normalized = raw.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');

        if ("LABORATORY".equals(normalized)) {
            return LAB;
        }

        if ("MEETING_ROOM".equals(normalized)) {
            return MEETING_ROOM;
        }

        if ("MEETING".equals(normalized)) {
            return MEETING_ROOM;
        }

        if ("CLASSROOM".equals(normalized)) {
            return LECTURE_HALL;
        }

        return ResourceType.valueOf(normalized);
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}