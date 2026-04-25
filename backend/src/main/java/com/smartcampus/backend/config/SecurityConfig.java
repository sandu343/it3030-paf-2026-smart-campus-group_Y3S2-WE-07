package com.smartcampus.backend.config;

import com.smartcampus.backend.filter.JwtAuthenticationFilter;
import com.smartcampus.backend.service.OAuth2Service;
import com.smartcampus.backend.service.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2Service oAuth2Service;
    private final TokenService tokenService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          OAuth2Service oAuth2Service,
                          TokenService tokenService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.oAuth2Service = oAuth2Service;
        this.tokenService = tokenService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            // OAuth2 authorization request state is stored in session by default.
            // IF_REQUIRED keeps JWT API flows working while allowing OAuth2 callback to succeed.
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/oauth2/**", "/login/oauth2/**", "/error").permitAll()
                .requestMatchers("/api/setup/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/user/**").authenticated()
                .requestMatchers("/api/notifications/**").authenticated()
                .anyRequest().authenticated()
            )

            // 🔥 FIXED OAuth2 BLOCK
            .oauth2Login(oauth2 -> {
                oauth2.successHandler((request, response, authentication) -> {
                    try {
                        var oAuth2User = (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getPrincipal();

                        String email = oAuth2User.getAttribute("email");
                        String name = oAuth2User.getAttribute("name");
                        log.info("OAuth2 success callback received for email={}", email);

                        var user = oAuth2Service.findOrCreateUserFromOAuth(email, name);
                        String token = tokenService.generateToken(user);

                        String userJson = String.format(
                            "{\"id\":\"%s\",\"name\":\"%s\",\"email\":\"%s\",\"role\":\"%s\"}",
                            user.getId(),
                            user.getName(),
                            user.getEmail(),
                            user.getRole()
                        );

                        String redirectUrl = "http://localhost:5173/auth/callback?token=" + token +
                                "&user=" + URLEncoder.encode(userJson, StandardCharsets.UTF_8);

                        response.sendRedirect(redirectUrl);
                    } catch (Exception ex) {
                        log.error("OAuth2 success handler failed", ex);
                        String safeMessage = ex.getMessage() != null && !ex.getMessage().isBlank()
                                ? ex.getMessage()
                                : "Google authentication failed";
                        String redirectUrl = "http://localhost:5173/login?error=" +
                                URLEncoder.encode(safeMessage, StandardCharsets.UTF_8);
                        response.sendRedirect(redirectUrl);
                    }
                });

                oauth2.failureHandler((request, response, exception) -> {
                    log.error("OAuth2 login failed", exception);
                    String errorMessage = exception.getMessage() != null && !exception.getMessage().isBlank()
                            ? exception.getMessage()
                            : "Google authentication failed";

                    String redirectUrl = "http://localhost:5173/login?error=" +
                            URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);

                    response.sendRedirect(redirectUrl);
                });
            })

            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
