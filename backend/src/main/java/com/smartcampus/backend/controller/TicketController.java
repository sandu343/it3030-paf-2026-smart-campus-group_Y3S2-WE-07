package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.*;
import com.smartcampus.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@Slf4j
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request) {
        String userId = getUserId();
        TicketResponse response = ticketService.createTicket(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{ticketId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable String ticketId) {
        TicketResponse response = ticketService.getTicket(ticketId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my/tickets")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<TicketResponse>> getMyTickets() {
        String userId = getUserId();
        List<TicketResponse> response = ticketService.getMyTickets(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TicketResponse>> getAllTickets() {
        List<TicketResponse> response = ticketService.getAllTickets();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('TECHNICIAN')")
    public ResponseEntity<List<TicketResponse>> getAssignedTickets() {
        String userId = getUserId();
        List<TicketResponse> response = ticketService.getAssignedTickets(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{ticketId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<TicketResponse> updateTicketStatus(
            @PathVariable String ticketId,
            @Valid @RequestBody UpdateTicketStatusRequest request) {
        String userId = getUserId();
        TicketResponse response = ticketService.updateTicketStatus(ticketId, request, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{ticketId}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable String ticketId,
            @RequestParam String assignToUserId) {
        TicketResponse response = ticketService.assignTicket(ticketId, assignToUserId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{ticketId}/comments")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<TicketResponse> addComment(
            @PathVariable String ticketId,
            @Valid @RequestBody TicketCommentRequest request) {
        String userId = getUserId();
        TicketResponse response = ticketService.addComment(ticketId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{ticketId}/comments/{commentId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<TicketResponse> updateComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @Valid @RequestBody TicketCommentRequest request) {
        String userId = getUserId();
        TicketResponse response = ticketService.updateComment(ticketId, commentId, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId) {
        String userId = getUserId();
        ticketService.deleteComment(ticketId, commentId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{ticketId}/attachments")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<TicketResponse> uploadAttachments(
            @PathVariable String ticketId,
            @RequestParam List<String> attachmentUrls) {
        // Implementation: In a real scenario, you would handle file upload
        // For now, this endpoint accepts pre-validated attachment URLs
        return ResponseEntity.ok(ticketService.getTicket(ticketId));
    }

    private String getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
