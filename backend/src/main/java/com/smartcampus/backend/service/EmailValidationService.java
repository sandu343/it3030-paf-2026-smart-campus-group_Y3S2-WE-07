package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.InvalidCampusEmailException;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class EmailValidationService {
    
    // Pattern: 2 letters (case-insensitive) + 8 digits + @my.sliit.lk
    // Examples: IT12345678@my.sliit.lk, it12345678@my.sliit.lk, CS87654321@my.sliit.lk
    private static final String CAMPUS_EMAIL_PATTERN = "^[A-Za-z]{2}\\d{8}@my\\.sliit\\.lk$";
    private static final Pattern CAMPUS_EMAIL_REGEX = Pattern.compile(CAMPUS_EMAIL_PATTERN);
    
    public boolean isValidCampusEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return CAMPUS_EMAIL_REGEX.matcher(email.trim()).matches();
    }
    
    public void validateCampusEmail(String email) {
        if (!isValidCampusEmail(email)) {
            throw new InvalidCampusEmailException("Invalid campus email address");
        }
    }
}
