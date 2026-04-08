package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.AuthResponse;
import com.smartcampus.backend.dto.AuthenticationResponse;
import com.smartcampus.backend.dto.LoginRequest;
import com.smartcampus.backend.dto.ResetPasswordRequest;
import com.smartcampus.backend.dto.RegisterRequest;
import com.smartcampus.backend.dto.StaffLoginRequest;
import com.smartcampus.backend.service.AuthService;
import com.smartcampus.backend.service.RegistrationService;
import com.smartcampus.backend.service.LoginService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AuthController {
    
    private final RegistrationService registrationService;
    private final LoginService loginService;
    private final AuthService authService;
    
    public AuthController(RegistrationService registrationService, 
                          LoginService loginService,
                          AuthService authService) {
        this.registrationService = registrationService;
        this.loginService = loginService;
        this.authService = authService;
    }
    
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthenticationResponse response = registrationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthenticationResponse response = loginService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/staff/login")
    public ResponseEntity<AuthResponse> staffLogin(@Valid @RequestBody StaffLoginRequest request) {
        AuthResponse response = authService.staffLogin(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }
}
