package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.AuthenticationResponse;
import com.smartcampus.backend.dto.LoginRequest;
import com.smartcampus.backend.exception.InvalidCredentialsException;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.util.List;

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
        try {
            // Find user by email
            List<User> candidates = userRepository.findAllByEmailIgnoreCaseOrderByCreatedAtDesc(request.getEmail().trim());
            User user = candidates.stream()
                .filter((candidate) -> candidate.getPasswordHash() != null && !candidate.getPasswordHash().isBlank())
                .findFirst()
                .orElseGet(() -> candidates.stream().findFirst().orElse(null));

            if (user == null) {
                throw new InvalidCredentialsException("Invalid email or password");
            }

            // Verify password
            if (!passwordService.verifyPassword(request.getPassword(), user.getPasswordHash())) {
                throw new InvalidCredentialsException("Invalid email or password");
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
        } catch (DataAccessException ex) {
            // Do not leak infrastructure details on login failures.
            throw new InvalidCredentialsException("Invalid email or password");
        }
    }
}
