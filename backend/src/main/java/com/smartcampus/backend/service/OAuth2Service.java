package com.smartcampus.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.dto.AuthenticationResponse;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OAuth2Service {
    
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;
    
    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;
    
    @Value("${spring.security.oauth2.client.registration.google.redirect-uri:http://localhost:8081/api/auth/google/callback}")
    private String redirectUri;
    
    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final EmailValidationService emailValidationService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    private static final String GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
    
    public OAuth2Service(UserRepository userRepository, 
                         TokenService tokenService,
                         EmailValidationService emailValidationService) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.emailValidationService = emailValidationService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
    
    public String getGoogleAuthorizationUrl() {
        return String.format(
            "%s?client_id=%s&redirect_uri=%s&response_type=code&scope=email profile&access_type=offline",
            GOOGLE_AUTH_URL,
            clientId,
            redirectUri
        );
    }
    
    public AuthenticationResponse authenticateWithGoogle(String code) {
        try {
            // Exchange code for access token
            String accessToken = exchangeCodeForToken(code);
            
            // Get user info from Google
            JsonNode userInfo = getUserInfo(accessToken);
            
            String email = userInfo.get("email").asText();
            String name = userInfo.get("name").asText();
            
            // Find or create user (validation included)
            User user = findOrCreateUserFromOAuth(email, name);
            
            // Generate JWT token
            String jwtToken = tokenService.generateToken(user);
            
            // Create response
            AuthenticationResponse.UserDto userDto = new AuthenticationResponse.UserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt()
            );
            
            return new AuthenticationResponse(jwtToken, userDto);
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed: " + e.getMessage(), e);
        }
    }
    
    private String exchangeCodeForToken(String code) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("code", code);
            params.add("client_id", clientId);
            params.add("client_secret", clientSecret);
            params.add("redirect_uri", redirectUri);
            params.add("grant_type", "authorization_code");
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                GOOGLE_TOKEN_URL,
                request,
                String.class
            );
            
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return jsonNode.get("access_token").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to exchange code for token: " + e.getMessage(), e);
        }
    }
    
    private JsonNode getUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                GOOGLE_USER_INFO_URL,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Failed to get user info: " + e.getMessage(), e);
        }
    }
    
    public User findOrCreateUserFromOAuth(String email, String name) {
        // Validate campus email
        emailValidationService.validateCampusEmail(email);
        
        Optional<User> existingUser = userRepository.findByEmail(email);
        
        if (existingUser.isPresent()) {
            return existingUser.get();
        }
        
        // Create new user
        User newUser = new User();
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setPasswordHash(""); // No password for OAuth users
        newUser.setRole(Role.USER);
        newUser.setStaff(false);
        newUser.setUsername(null);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());
        newUser.setActive(true);
        
        return userRepository.save(newUser);
    }
}
