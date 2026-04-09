package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.AuthenticationResponse;
import com.smartcampus.backend.dto.RegisterRequest;
import com.smartcampus.backend.exception.DuplicateEmailException;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class RegistrationService {
    
    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final EmailValidationService emailValidationService;
    private final TokenService tokenService;
    
    public RegistrationService(UserRepository userRepository, 
                               PasswordService passwordService,
                               EmailValidationService emailValidationService,
                               TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.emailValidationService = emailValidationService;
        this.tokenService = tokenService;
    }
    
    public AuthenticationResponse register(RegisterRequest request) {
        // Validate campus email
        emailValidationService.validateCampusEmail(request.getEmail());
        
        // Check if email already exists
        if (userRepository.existsByEmailIgnoreCase(request.getEmail().trim())) {
            throw new DuplicateEmailException("Email already registered");
        }
        
        // Hash password
        String passwordHash = passwordService.hashPassword(request.getPassword());
        
        // Create user
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().trim());
        user.setPasswordHash(passwordHash);
        user.setPhone(request.getPhone());
        user.setRole(Role.USER);
        user.setStaff(false);
        user.setUsername(null);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setActive(true);
        
        // Save user
        User savedUser = userRepository.save(user);
        
        // Generate token
        String token = tokenService.generateToken(savedUser);
        
        // Create response
        AuthenticationResponse.UserDto userDto = new AuthenticationResponse.UserDto(
            savedUser.getId(),
            savedUser.getName(),
            savedUser.getEmail(),
            savedUser.getRole(),
            savedUser.getCreatedAt()
        );
        
        return new AuthenticationResponse(token, userDto);
    }
}
