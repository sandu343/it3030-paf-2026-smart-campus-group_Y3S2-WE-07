package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.AuthResponse;
import com.smartcampus.backend.dto.StaffLoginRequest;
import com.smartcampus.backend.exception.InvalidCredentialsException;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

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
        User user = userRepository.findByUsername(request.getUsername())
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
}
