package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.UserNotFoundException;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    public User getUserById(String userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
    }
    
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    public User getUserByPrincipal(String principal) {
        return userRepository.findById(principal)
            .or(() -> userRepository.findByEmail(principal))
            .or(() -> userRepository.findByUsername(principal))
            .orElseThrow(() -> new UserNotFoundException("User not found"));
    }
}
