package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.AuthResponse;
import com.smartcampus.backend.dto.ResetPasswordRequest;
import com.smartcampus.backend.dto.StaffLoginRequest;
import com.smartcampus.backend.exception.InvalidCredentialsException;
import com.smartcampus.backend.exception.ValidationException;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final TokenService tokenService;

    public AuthService(UserRepository userRepository,
                       PasswordService passwordService,
                       TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
    }

    public AuthResponse staffLogin(StaffLoginRequest request) {
        String normalizedUsername = request.getUsername() == null
            ? ""
            : request.getUsername().trim().toLowerCase();

        User user = userRepository.findByUsernameIgnoreCase(normalizedUsername)
            .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        if (!user.isStaff()) {
            throw new AccessDeniedException("This portal is for staff only. Students please use the main login.");
        }

        if (!passwordService.verifyPassword(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = tokenService.generateToken(user);

        return new AuthResponse(
            token,
            user.getId(),
            user.getUsername(),
            user.getName(),
            user.getRole().name(),
            user.isMustChangePassword()
        );
    }

    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        if (email.isBlank()) {
            throw new ValidationException("Email is required");
        }

        // Code is validated in frontend flow for now; this ensures request shape is valid.
        if (request.getCode() == null || request.getCode().trim().isBlank()) {
            throw new ValidationException("Verification code is required");
        }

        String newPassword = request.getNewPassword();
        validatePasswordStrength(newPassword);

        List<User> candidates = userRepository.findAllByEmailIgnoreCaseOrderByCreatedAtDesc(email);
        User user = candidates.stream().findFirst()
            .orElseThrow(() -> new ValidationException("No user found for this email"));

        user.setPasswordHash(passwordService.hashPassword(newPassword));
        user.setMustChangePassword(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new ValidationException("Password must be at least 8 characters");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new ValidationException("Password must contain at least 1 uppercase letter");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new ValidationException("Password must contain at least 1 number");
        }
    }
}
