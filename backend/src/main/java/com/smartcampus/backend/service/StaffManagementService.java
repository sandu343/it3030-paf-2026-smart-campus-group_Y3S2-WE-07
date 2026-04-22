package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.CreateTechnicianRequest;
import com.smartcampus.backend.dto.StaffResponse;
import com.smartcampus.backend.dto.UpdateTechnicianRequest;
import com.smartcampus.backend.exception.DuplicateUsernameException;
import com.smartcampus.backend.exception.UserNotFoundException;
import com.smartcampus.backend.exception.ValidationException;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StaffManagementService {

    private final UserRepository userRepository;
    private final PasswordService passwordService;

    public StaffManagementService(UserRepository userRepository, PasswordService passwordService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    public StaffResponse createTechnician(CreateTechnicianRequest request, String adminId) {
        String username = request.getUsername().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new DuplicateUsernameException("Username '" + username + "' is already taken");
        }

        String email = username + "@staff.smartcampus.lk";
        String staffId = (request.getStaffId() != null && !request.getStaffId().trim().isEmpty())
            ? request.getStaffId().trim()
            : generateStaffId();

        User technician = new User();
        technician.setName(request.getFullName());
        technician.setUsername(username);
        technician.setEmail(email);
        technician.setPasswordHash(passwordService.hashPassword(request.getInitialPassword()));
        technician.setRole(Role.TECHNICIAN);
        technician.setStaff(true);
        technician.setMustChangePassword(true);
        technician.setDepartment(request.getDepartment());
        technician.setPhoneNumber(request.getPhoneNumber());
        technician.setStaffId(staffId);
        technician.setCreatedByAdminId(adminId);
        technician.setCreatedAt(LocalDateTime.now());
        technician.setUpdatedAt(LocalDateTime.now());
        technician.setActive(true);

        User saved = userRepository.save(technician);
        return mapToStaffResponse(saved);
    }

    public List<StaffResponse> getAllTechnicians() {
        return userRepository.findAllByRole(Role.TECHNICIAN)
            .stream()
            .map(this::mapToStaffResponse)
            .collect(Collectors.toList());
    }

    public boolean isUsernameAvailable(String username) {
        if (username == null || username.trim().isEmpty()) {
            return false;
        }

        String normalized = username.trim().toLowerCase();
        return !userRepository.existsByUsername(normalized);
    }

    public StaffResponse updateTechnician(String techId, UpdateTechnicianRequest request) {
        User technician = userRepository.findById(techId)
            .orElseThrow(() -> new UserNotFoundException("Technician not found"));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new ValidationException("Target user is not a technician");
        }

        if (request.getDepartment() != null) {
            technician.setDepartment(request.getDepartment());
        }
        if (request.getPhoneNumber() != null) {
            technician.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getActive() != null) {
            technician.setActive(request.getActive());
        }

        technician.setUpdatedAt(LocalDateTime.now());
        return mapToStaffResponse(userRepository.save(technician));
    }

    public void deactivateTechnician(String techId) {
        User technician = userRepository.findById(techId)
            .orElseThrow(() -> new UserNotFoundException("Technician not found"));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new ValidationException("Target user is not a technician");
        }

        technician.setActive(false);
        technician.setUpdatedAt(LocalDateTime.now());
        userRepository.save(technician);
    }

    private String generateStaffId() {
        long count = userRepository.findAllByRole(Role.TECHNICIAN).size() + 1L;
        return String.format("TECH-%03d", count);
    }

    private StaffResponse mapToStaffResponse(User user) {
        StaffResponse response = new StaffResponse();
        response.setId(user.getId());
        response.setFullName(user.getName());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());
        response.setDepartment(user.getDepartment());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setStaffId(user.getStaffId());
        response.setMustChangePassword(user.isMustChangePassword());
        response.setLastLoginAt(user.getLastLoginAt());
        response.setCreatedAt(user.getCreatedAt());
        // Ticket module is not in this backend yet, so defaulting to 0 for now.
        response.setActiveTicketsCount(0);
        return response;
    }
}
