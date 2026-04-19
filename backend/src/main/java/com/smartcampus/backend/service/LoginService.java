package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.AuthenticationResponse;
import com.smartcampus.backend.dto.LoginRequest;
import com.smartcampus.backend.exception.InvalidCredentialsException;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class LoginService {
    
    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final TokenService tokenService;
    
    public LoginService(UserRepository userRepository, 
                        PasswordService passwordService,
                        TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
    }
    
    public AuthenticationResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
            .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));
        
        // Verify password
        if (!passwordService.verifyPassword(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }
        
        // Generate token
        String token = tokenService.generateToken(user);
        
        // Create response
        AuthenticationResponse.UserDto userDto = new AuthenticationResponse.UserDto(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.getCreatedAt()
        );
        
        return new AuthenticationResponse(token, userDto);
    }
}
