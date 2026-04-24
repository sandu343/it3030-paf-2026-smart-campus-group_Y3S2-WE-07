package com.smartcampus.backend.filter;

import com.smartcampus.backend.service.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final TokenService tokenService;
    
    public JwtAuthenticationFilter(TokenService tokenService) {
        this.tokenService = tokenService;
    }
    
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                   @NonNull HttpServletResponse response, 
                                   @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            
            try {
                // Validate token
                tokenService.validateToken(token);
                
                String userId = tokenService.extractUserId(token);
                String role = tokenService.extractRole(token);
                List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + role)
                );
                
                // Create authentication object
                Authentication authentication = new JwtAuthenticationToken(userId, authorities);
                
                // Set authentication in security context
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                // Token is invalid or expired, continue without authentication
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
