package com.smartcampus.backend.service;

import com.smartcampus.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;

class PasswordServiceTest {

    private PasswordService passwordService;
    private String testPassword;

    @BeforeEach
    void setUp() {
        passwordService = new PasswordService(Mockito.mock(UserRepository.class));
        testPassword = "SecurePassword123!";
    }

    @Test
    void hashPassword_shouldReturnNonEmptyHash() {
        // When
        String hash = passwordService.hashPassword(testPassword);

        // Then
        assertNotNull(hash);
        assertFalse(hash.isEmpty());
        assertTrue(hash.startsWith("$2a$12$"));
    }

    @Test
    void hashPassword_shouldReturnDifferentHashEachTime() {
        // When
        String hash1 = passwordService.hashPassword(testPassword);
        String hash2 = passwordService.hashPassword(testPassword);

        // Then
        assertNotNull(hash1);
        assertNotNull(hash2);
        assertNotEquals(hash1, hash2, "BCrypt should generate different hashes with different salts");
    }

    @Test
    void verifyPassword_shouldReturnTrueForMatchingPassword() {
        // Given
        String hash = passwordService.hashPassword(testPassword);

        // When
        boolean result = passwordService.verifyPassword(testPassword, hash);

        // Then
        assertTrue(result);
    }

    @Test
    void verifyPassword_shouldReturnFalseForNonMatchingPassword() {
        // Given
        String hash = passwordService.hashPassword(testPassword);
        String wrongPassword = "WrongPassword123!";

        // When
        boolean result = passwordService.verifyPassword(wrongPassword, hash);

        // Then
        assertFalse(result);
    }

    @Test
    void verifyPassword_shouldReturnFalseForNullPassword() {
        // Given
        String hash = passwordService.hashPassword(testPassword);

        // When
        boolean result = passwordService.verifyPassword(null, hash);

        // Then
        assertFalse(result);
    }

    @Test
    void verifyPassword_shouldReturnFalseForNullHash() {
        // When
        boolean result = passwordService.verifyPassword(testPassword, null);

        // Then
        assertFalse(result);
    }

    @Test
    void verifyPassword_shouldReturnFalseForEmptyPassword() {
        // Given
        String hash = passwordService.hashPassword(testPassword);

        // When
        boolean result = passwordService.verifyPassword("", hash);

        // Then
        assertFalse(result);
    }

    @Test
    void hashPassword_shouldThrowExceptionForNullPassword() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            passwordService.hashPassword(null);
        });
    }

    @Test
    void hashPassword_shouldThrowExceptionForEmptyPassword() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            passwordService.hashPassword("");
        });
    }

    @Test
    void hashPassword_shouldThrowExceptionForWhitespaceOnlyPassword() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            passwordService.hashPassword("   ");
        });
    }
}
