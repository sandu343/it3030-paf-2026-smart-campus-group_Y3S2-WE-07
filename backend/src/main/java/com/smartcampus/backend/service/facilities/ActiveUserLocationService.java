package com.smartcampus.backend.service.facilities;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ActiveUserLocationService {

    private final Map<String, ActiveLocation> activeLocations = new ConcurrentHashMap<>();

    public void checkIn(String userId, String userName, double latitude, double longitude, Duration ttl) {
        cleanupExpired();
        Instant expiresAt = Instant.now().plus(ttl);
        activeLocations.put(userId, new ActiveLocation(userId, userName, latitude, longitude, expiresAt));
    }

    public int getActiveUserCount() {
        cleanupExpired();
        return activeLocations.size();
    }

    public int countUsersInside(double centerLat, double centerLng, int radiusMeters) {
        cleanupExpired();
        int count = 0;
        for (ActiveLocation location : activeLocations.values()) {
            double distance = distanceMeters(centerLat, centerLng, location.latitude(), location.longitude());
            if (distance <= radiusMeters) {
                count++;
            }
        }
        return count;
    }

    public List<ActiveLocation> getUsersInside(double centerLat, double centerLng, int radiusMeters) {
        cleanupExpired();
        List<ActiveLocation> insideUsers = new ArrayList<>();
        for (ActiveLocation location : activeLocations.values()) {
            double distance = distanceMeters(centerLat, centerLng, location.latitude(), location.longitude());
            if (distance <= radiusMeters) {
                insideUsers.add(location);
            }
        }
        return insideUsers;
    }

    public List<ActiveLocation> getActiveLocations() {
        cleanupExpired();
        return new ArrayList<>(activeLocations.values());
    }

    private void cleanupExpired() {
        Instant now = Instant.now();
        activeLocations.values().removeIf(location -> location.expiresAt().isBefore(now));
    }

    private double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        final double earthRadiusMeters = 6371000.0;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return earthRadiusMeters * c;
    }

    public record ActiveLocation(String userId, String userName, double latitude, double longitude, Instant expiresAt) {
    }
}
