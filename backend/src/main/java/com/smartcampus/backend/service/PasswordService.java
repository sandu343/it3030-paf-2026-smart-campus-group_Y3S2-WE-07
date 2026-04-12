package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.ChangePasswordRequest;
import com.smartcampus.backend.exception.InvalidCredentialsException;
import com.smartcampus.backend.exception.UserNotFoundException;
import com.smartcampus.backend.exception.ValidationException;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder.BCryptVersion;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PasswordService {
    
    private final BCryptPasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    
    public PasswordService(UserRepository userRepository) {
        this.userRepository = userRepository;
        // BCrypt with cost factor 12
        this.passwordEncoder = new BCryptPasswordEncoder(BCryptVersion.$2A, 12);
    }
    
    public String hashPassword(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }
        return passwordEncoder.encode(password);
    }
    
    public boolean verifyPassword(String password, String passwordHash) {
        if (password == null || passwordHash == null) {
            return false;
        }
        return passwordEncoder.matches(password, passwordHash);
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new ValidationException("New passwords do not match");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!verifyPassword(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        if (verifyPassword(request.getNewPassword(), user.getPasswordHash())) {
            throw new ValidationException("New password must be different from current password");
        }

        validatePasswordStrength(request.getNewPassword());

        user.setPasswordHash(hashPassword(request.getNewPassword()));
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
