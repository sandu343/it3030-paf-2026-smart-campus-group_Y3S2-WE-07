package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.AuthenticationResponse;
import com.smartcampus.backend.service.OAuth2Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class OAuth2Controller {
    
    private final OAuth2Service oAuth2Service;
    
    public OAuth2Controller(OAuth2Service oAuth2Service) {
        this.oAuth2Service = oAuth2Service;
    }
    
    @GetMapping("/google")
    public ResponseEntity<String> googleLogin() {
        String authorizationUrl = oAuth2Service.getGoogleAuthorizationUrl();
        return ResponseEntity.ok(authorizationUrl);
    }
    
    @GetMapping("/google/callback")
    public ResponseEntity<?> googleCallback(@RequestParam("code") String code) {
        try {
            AuthenticationResponse response = oAuth2Service.authenticateWithGoogle(code);
            
            // Redirect to frontend with token
            String redirectUrl = String.format(
                "http://localhost:5173/auth/callback?token=%s&user=%s",
                response.getToken(),
                java.net.URLEncoder.encode(
                    String.format("{\"id\":\"%s\",\"name\":\"%s\",\"email\":\"%s\",\"role\":\"%s\"}",
                        response.getUser().getId(),
                        response.getUser().getName(),
                        response.getUser().getEmail(),
                        response.getUser().getRole()
                    ),
                    "UTF-8"
                )
            );
            
            return ResponseEntity.status(302)
                .header("Location", redirectUrl)
                .build();
        } catch (Exception e) {
            String errorUrl = "http://localhost:5173/login?error=" + 
                java.net.URLEncoder.encode(e.getMessage(), java.nio.charset.StandardCharsets.UTF_8);
            return ResponseEntity.status(302)
                .header("Location", errorUrl)
                .build();
        }
    }
}
