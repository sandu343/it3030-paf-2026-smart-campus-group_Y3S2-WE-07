package com.smartcampus.backend.service;

import com.smartcampus.backend.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class TokenService {
    
    @Value("${jwt.secret}")
    private String secretKeyString;
    
    @Value("${jwt.expiration-ms:86400000}")
    private long expirationMs;
    
    private SecretKey secretKey;
    
    public TokenService() {
    }
    
    @jakarta.annotation.PostConstruct
    public void init() {
        if (secretKeyString == null || secretKeyString.isEmpty()) {
            // Default 512-bit safe Base64 encoded key for development
            secretKeyString = "YVp2S3R4bVp3cWpyYzV3Nzg5MGFiY2RlZmdoaWtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5MGFiYzV3Nzg5MGFic3R1dnd4eXp6";
        }
        byte[] keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(secretKeyString);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }
    
    public String generateToken(User user) {
        if (user == null) {
            throw new IllegalArgumentException("Cannot generate token: user is null");
        }
        if (user.getId() == null || user.getId().isBlank()) {
            throw new IllegalArgumentException("Cannot generate token: user id is missing");
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("Cannot generate token: user email is missing");
        }

        String roleClaim = user.getRole() != null ? user.getRole().name() : "USER";
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);
        
        return Jwts.builder()
            .setSubject(user.getId())
            .claim("email", user.getEmail())
            .claim("role", roleClaim)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(secretKey, SignatureAlgorithm.HS512)
            .compact();
    }
    
    public Jws<Claims> validateToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token);
    }
    
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
            return claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
    
    public String extractUserId(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
        return claims.getSubject();
    }
    
    public String extractEmail(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
        return claims.get("email", String.class);
    }
    
    public String extractRole(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
        return claims.get("role", String.class);
    }
}
