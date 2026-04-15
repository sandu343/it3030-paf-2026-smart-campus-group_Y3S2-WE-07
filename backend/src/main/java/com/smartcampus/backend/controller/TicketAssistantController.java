package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.TicketAssistantRequest;
import com.smartcampus.backend.dto.TicketAssistantResponse;
import com.smartcampus.backend.service.TicketAssistantService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tickets/assistant")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class TicketAssistantController {

    @Autowired
    private TicketAssistantService ticketAssistantService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<TicketAssistantResponse> askAssistant(
            @Valid @RequestBody TicketAssistantRequest request) {
        String userId = getUserId();
        TicketAssistantResponse response = ticketAssistantService.handleMessage(userId, request.getMessage());
        return ResponseEntity.ok(response);
    }

    private String getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
