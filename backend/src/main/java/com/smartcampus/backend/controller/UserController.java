package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.ChangePasswordRequest;
import com.smartcampus.backend.dto.AuthenticationResponse;
import com.smartcampus.backend.dto.MessageResponse;
import com.smartcampus.backend.dto.ResourceResponse;
import com.smartcampus.backend.dto.facilities.LocationCheckInResponse;
import com.smartcampus.backend.dto.facilities.StudyAreaActiveMembersResponse;
import com.smartcampus.backend.dto.facilities.StudyAreaOccupancyResponse;
import com.smartcampus.backend.dto.facilities.UserLocationCheckInRequest;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.service.PasswordService;
import com.smartcampus.backend.service.ResourceManagementService;
import com.smartcampus.backend.service.UserService;
import com.smartcampus.backend.service.facilities.ActiveUserLocationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class UserController {

    private static final Duration LOCATION_TTL = Duration.ofMinutes(2);

    private final UserService userService;
    private final PasswordService passwordService;
    private final ResourceManagementService resourceManagementService;
    private final ActiveUserLocationService activeUserLocationService;

    public UserController(UserService userService, PasswordService passwordService,
            ResourceManagementService resourceManagementService,
            ActiveUserLocationService activeUserLocationService) {
        this.userService = userService;
        this.passwordService = passwordService;
        this.resourceManagementService = resourceManagementService;
        this.activeUserLocationService = activeUserLocationService;
    }

    @GetMapping("/me")
    public ResponseEntity<AuthenticationResponse.UserDto> getProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String principal = authentication.getName();

        User user = userService.getUserByPrincipal(principal);

        AuthenticationResponse.UserDto userDto = new AuthenticationResponse.UserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt());

        return ResponseEntity.ok(userDto);
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByPrincipal(authentication.getName());
        passwordService.changePassword(user.getId(), request);
        return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
    }

    @GetMapping("/study-areas")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ResourceResponse>> getStudyAreas() {
        return ResponseEntity.ok(resourceManagementService.getResources("STUDY_AREA", null, "AVAILABLE", null));
    }

    @PostMapping("/location/check-in")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LocationCheckInResponse> checkInLocation(
            @Valid @RequestBody UserLocationCheckInRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByPrincipal(authentication.getName());

        activeUserLocationService.checkIn(
                user.getId(),
                user.getName(),
                request.getLatitude(),
                request.getLongitude(),
                LOCATION_TTL);

        return ResponseEntity.ok(new LocationCheckInResponse(
                "Location updated",
                (int) LOCATION_TTL.toSeconds(),
                activeUserLocationService.getActiveUserCount()));
    }

    @GetMapping("/study-areas/occupancy")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<StudyAreaOccupancyResponse>> getStudyAreaOccupancy() {
        List<ResourceResponse> studyAreas = resourceManagementService.getResources("STUDY_AREA", null, "AVAILABLE",
                null);

        List<StudyAreaOccupancyResponse> occupancy = studyAreas.stream()
                .filter(area -> area.getLatitude() != null && area.getLongitude() != null)
                .map(area -> new StudyAreaOccupancyResponse(
                        area.getId(),
                        area.getHallName(),
                        activeUserLocationService.countUsersInside(
                                area.getLatitude(),
                                area.getLongitude(),
                                area.getMapRadiusMeters() == null ? 50 : area.getMapRadiusMeters())))
                .collect(Collectors.toList());

        return ResponseEntity.ok(occupancy);
    }

    @GetMapping("/study-areas/active-members")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<StudyAreaActiveMembersResponse>> getStudyAreaActiveMembers() {
        List<ResourceResponse> studyAreas = resourceManagementService.getResources("STUDY_AREA", null, "AVAILABLE",
                null);

        List<StudyAreaActiveMembersResponse> response = studyAreas.stream()
                .filter(area -> area.getLatitude() != null && area.getLongitude() != null)
                .map(area -> {
                    int radius = area.getMapRadiusMeters() == null ? 50 : area.getMapRadiusMeters();
                    List<StudyAreaActiveMembersResponse.ActiveMemberPin> members = activeUserLocationService
                            .getUsersInside(area.getLatitude(), area.getLongitude(), radius)
                            .stream()
                            .map(user -> new StudyAreaActiveMembersResponse.ActiveMemberPin(
                                    user.userId(),
                                    user.userName(),
                                    user.latitude(),
                                    user.longitude()))
                            .collect(Collectors.toList());

                    return new StudyAreaActiveMembersResponse(area.getId(), area.getHallName(), members);
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
