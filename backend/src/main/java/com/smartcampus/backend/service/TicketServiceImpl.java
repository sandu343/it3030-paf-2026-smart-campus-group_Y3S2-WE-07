package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.*;
import com.smartcampus.backend.exception.*;
import com.smartcampus.backend.model.*;
import com.smartcampus.backend.repository.TicketRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.Objects;

@Service
@Slf4j
public class TicketServiceImpl implements TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationTriggerService notificationTriggerService;

    private static final Map<TicketStatus, Set<TicketStatus>> VALID_TRANSITIONS = new HashMap<>();

    static {
        // OPEN can go to IN_PROGRESS or REJECTED
        VALID_TRANSITIONS.put(TicketStatus.OPEN,
                new HashSet<>(Arrays.asList(TicketStatus.IN_PROGRESS, TicketStatus.REJECTED)));

        // IN_PROGRESS can go to RESOLVED or REJECTED
        VALID_TRANSITIONS.put(TicketStatus.IN_PROGRESS,
                new HashSet<>(Arrays.asList(TicketStatus.RESOLVED, TicketStatus.REJECTED)));

        // RESOLVED can only go to CLOSED
        VALID_TRANSITIONS.put(TicketStatus.RESOLVED,
                new HashSet<>(Collections.singletonList(TicketStatus.CLOSED)));

        // CLOSED cannot transition
        VALID_TRANSITIONS.put(TicketStatus.CLOSED, new HashSet<>());

        // REJECTED cannot transition
        VALID_TRANSITIONS.put(TicketStatus.REJECTED, new HashSet<>());
    }

    @Override
    public TicketResponse createTicket(CreateTicketRequest request, String userId) {
        log.info("Creating ticket for user: {}", userId);

        // Validate that either resourceId or location is provided
        if ((request.getResourceId() == null || request.getResourceId().isBlank()) &&
                (request.getLocation() == null || request.getLocation().isBlank())) {
            throw new IllegalArgumentException("Either resourceId or location must be provided");
        }

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setPriority(TicketPriority.valueOf(request.getPriority()));
        ticket.setCategory(request.getCategory().trim());
        ticket.setResourceId(request.getResourceId() != null ? request.getResourceId().trim() : null);
        ticket.setLocation(request.getLocation() != null ? request.getLocation().trim() : null);
        ticket.setPreferredContact(request.getPreferredContact().trim());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setReportedBy(userId);
        ticket.setReportedByName(resolveUserName(userId));
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setComments(new ArrayList<>());
        ticket.setAttachmentUrls(new ArrayList<>());

        // SLA calculation based on priority (Member 3 novelty feature)
        LocalDateTime slaDeadline = calculateSLADeadline(ticket.getPriority());
        ticket.setSlaDeadline(slaDeadline);
        ticket.setIsOverdue(false);
        ticket.setEscalationLevel(EscalationLevel.NORMAL);
        ticket.setResolvedWithinSla(null); // Set only when resolved/closed

        Ticket savedTicket = ticketRepository.save(ticket);
        notificationTriggerService.triggerTicketCreatedNotification(
                savedTicket.getReportedBy(),
                savedTicket.getId(),
                savedTicket.getTitle());
        notificationTriggerService.triggerAdminTicketCreatedNotification(
                savedTicket.getId(),
                savedTicket.getTitle(),
                savedTicket.getReportedByName());
        log.info("Ticket created with ID: {} (SLA Deadline: {})", savedTicket.getId(), slaDeadline);

        return convertToResponse(savedTicket);
    }

    @Override
    public TicketResponse getTicket(String ticketId) {
        String safeTicketId = Objects.requireNonNull(ticketId, "ticketId");
        log.info("Fetching ticket: {}", safeTicketId);

        Ticket ticket = ticketRepository.findById(safeTicketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found: " + safeTicketId));

        // Update SLA escalation level on retrieval
        updateSLAEscalation(ticket);

        return convertToResponse(ticket);
    }

    @Override
    public List<TicketResponse> getMyTickets(String userId) {
        String safeUserId = Objects.requireNonNull(userId, "userId");
        log.info("Fetching tickets for user: {}", safeUserId);

        List<Ticket> tickets = ticketRepository.findByReportedBy(safeUserId);
        return tickets.stream().map(this::convertToResponse).toList();
    }

    @Override
    public List<TicketResponse> getAllTickets() {
        log.info("Fetching all tickets");

        List<Ticket> tickets = ticketRepository.findAll();
        return tickets.stream().map(this::convertToResponse).toList();
    }

    @Override
    public List<TicketResponse> getAssignedTickets(String userId) {
        String safeUserId = Objects.requireNonNull(userId, "userId");
        log.info("Fetching tickets assigned to user: {}", safeUserId);

        List<Ticket> tickets = ticketRepository.findByAssignedTo(safeUserId);
        return tickets.stream().map(this::convertToResponse).toList();
    }

    @Override
    public TicketResponse updateTicketStatus(String ticketId, UpdateTicketStatusRequest request, String userId) {
        String safeTicketId = Objects.requireNonNull(ticketId, "ticketId");
        String safeUserId = Objects.requireNonNull(userId, "userId");
        log.info("Updating ticket {} status to {}", safeTicketId, request.getStatus());

        Ticket ticket = ticketRepository.findById(safeTicketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found: " + safeTicketId));

        // Check if user is technician - validate they can only update assigned tickets
        User user = userRepository.findById(safeUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + safeUserId));

        if (user.getRole() == Role.TECHNICIAN) {
            if (ticket.getAssignedTo() == null || !ticket.getAssignedTo().equals(safeUserId)) {
                throw new IllegalArgumentException("Technicians can only update their assigned tickets");
            }

            // Validate technician can only move from OPEN -> IN_PROGRESS or IN_PROGRESS ->
            // RESOLVED
            TicketStatus newStatus = TicketStatus.valueOf(request.getStatus());
            if (!isTechnicianAllowedTransition(ticket.getStatus(), newStatus)) {
                throw new IllegalArgumentException("Technicians cannot perform this status transition");
            }
        }

        TicketStatus newStatus = TicketStatus.valueOf(request.getStatus());
        validateStatusTransition(ticket.getStatus(), newStatus);

        // Validate required fields for specific transitions
        if (newStatus == TicketStatus.RESOLVED &&
                (request.getResolutionNotes() == null || request.getResolutionNotes().isBlank())) {
            throw new IllegalArgumentException("Resolution notes are required when moving to RESOLVED");
        }

        if (newStatus == TicketStatus.REJECTED &&
                (request.getRejectionReason() == null || request.getRejectionReason().isBlank())) {
            throw new IllegalArgumentException("Rejection reason is required when moving to REJECTED");
        }

        ticket.setStatus(newStatus);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (newStatus == TicketStatus.RESOLVED) {
            ticket.setResolutionNotes(request.getResolutionNotes().trim());
            ticket.setResolvedAt(LocalDateTime.now());
            // Record if resolved within SLA
            if (ticket.getSlaDeadline() != null) {
                ticket.setResolvedWithinSla(LocalDateTime.now().isBefore(ticket.getSlaDeadline()));
            }
        }

        if (newStatus == TicketStatus.REJECTED) {
            ticket.setRejectionReason(request.getRejectionReason().trim());
        }

        if (newStatus == TicketStatus.CLOSED) {
            ticket.setResolvedAt(LocalDateTime.now());
            // If not already recorded in RESOLVED state, check here
            if (ticket.getResolvedWithinSla() == null && ticket.getSlaDeadline() != null) {
                ticket.setResolvedWithinSla(LocalDateTime.now().isBefore(ticket.getSlaDeadline()));
            }
        }

        Ticket updated = ticketRepository.save(ticket);

        if (updated.getReportedBy() != null && !updated.getReportedBy().equals(safeUserId)) {
            notificationTriggerService.triggerTicketStatusUpdatedNotification(
                    updated.getReportedBy(),
                    updated.getId(),
                    updated.getTitle(),
                    updated.getStatus().name().replace('_', ' '));
        }

        log.info("Ticket status updated successfully");

        return convertToResponse(updated);
    }

    @Override
    public TicketResponse assignTicket(String ticketId, String assignToUserId) {
        String safeTicketId = Objects.requireNonNull(ticketId, "ticketId");
        String safeAssignToUserId = Objects.requireNonNull(assignToUserId, "assignToUserId");
        log.info("Assigning ticket {} to user {}", safeTicketId, safeAssignToUserId);

        Ticket ticket = ticketRepository.findById(safeTicketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found: " + safeTicketId));

        User assignee = userRepository.findById(safeAssignToUserId)
                .orElseThrow(() -> new IllegalArgumentException("Assigned user not found: " + safeAssignToUserId));

        ticket.setAssignedTo(safeAssignToUserId);
        ticket.setAssignedToName(assignee.getName());
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket updated = ticketRepository.save(ticket);

        if (updated.getReportedBy() != null) {
            notificationTriggerService.triggerTicketAssignmentUpdatedNotification(
                    updated.getReportedBy(),
                    updated.getId(),
                    updated.getTitle(),
                    assignee.getName());
        }

        if (!safeAssignToUserId.equals(updated.getReportedBy())) {
            notificationTriggerService.triggerTicketAssignedNotification(
                    safeAssignToUserId,
                    updated.getId(),
                    updated.getTitle());
        }

        log.info("Ticket assigned successfully");

        return convertToResponse(updated);
    }

    @Override
    public TicketResponse addComment(String ticketId, TicketCommentRequest request, String userId) {
        String safeTicketId = Objects.requireNonNull(ticketId, "ticketId");
        String safeUserId = Objects.requireNonNull(userId, "userId");
        log.info("Adding comment to ticket {}", safeTicketId);

        Ticket ticket = ticketRepository.findById(safeTicketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found: " + safeTicketId));

        String message = request.getMessage().trim();
        if (message.isEmpty()) {
            throw new IllegalArgumentException("Comment message cannot be empty");
        }

        TicketComment comment = new TicketComment();
        comment.setId(UUID.randomUUID().toString());
        comment.setMessage(message);
        comment.setUserId(safeUserId);
        comment.setUserName(resolveUserName(safeUserId));
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());

        ticket.getComments().add(comment);
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket updated = ticketRepository.save(ticket);

        if (updated.getReportedBy() != null && !updated.getReportedBy().equals(safeUserId)) {
            notificationTriggerService.triggerTicketCommentAddedNotification(
                    updated.getReportedBy(),
                    updated.getId(),
                    updated.getTitle(),
                    comment.getUserName());
        }

        log.info("Comment added successfully");

        return convertToResponse(updated);
    }

    @Override
    public TicketResponse updateComment(String ticketId, String commentId, TicketCommentRequest request,
            String userId) {
        String safeTicketId = Objects.requireNonNull(ticketId, "ticketId");
        String safeUserId = Objects.requireNonNull(userId, "userId");
        log.info("Updating comment {} in ticket {}", commentId, safeTicketId);

        Ticket ticket = ticketRepository.findById(safeTicketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found: " + safeTicketId));

        TicketComment comment = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new CommentNotFoundException("Comment not found: " + commentId));

        if (!comment.getUserId().equals(safeUserId)) {
            throw new CommentAccessDeniedException("You can only edit your own comments");
        }

        String message = request.getMessage().trim();
        if (message.isEmpty()) {
            throw new IllegalArgumentException("Comment message cannot be empty");
        }

        comment.setMessage(message);
        comment.setUpdatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket updated = ticketRepository.save(ticket);
        log.info("Comment updated successfully");

        return convertToResponse(updated);
    }

    @Override
    public TicketResponse deleteComment(String ticketId, String commentId, String userId) {
        String safeTicketId = Objects.requireNonNull(ticketId, "ticketId");
        String safeUserId = Objects.requireNonNull(userId, "userId");
        log.info("Deleting comment {} from ticket {}", commentId, safeTicketId);

        Ticket ticket = ticketRepository.findById(safeTicketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found: " + safeTicketId));

        TicketComment comment = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new CommentNotFoundException("Comment not found: " + commentId));

        // Only comment owner can delete. Admin role check could be added here if needed
        if (!comment.getUserId().equals(safeUserId)) {
            throw new CommentAccessDeniedException("You can only delete your own comments");
        }

        ticket.getComments().removeIf(c -> c.getId().equals(commentId));
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket updated = ticketRepository.save(ticket);
        log.info("Comment deleted successfully");

        return convertToResponse(updated);
    }

    private boolean isTechnicianAllowedTransition(TicketStatus current, TicketStatus next) {
        // Technicians can only: OPEN -> IN_PROGRESS and IN_PROGRESS -> RESOLVED
        if (current == TicketStatus.OPEN && next == TicketStatus.IN_PROGRESS) {
            return true;
        }
        if (current == TicketStatus.IN_PROGRESS && next == TicketStatus.RESOLVED) {
            return true;
        }
        return false;
    }

    private void validateStatusTransition(TicketStatus current, TicketStatus next) {
        if (!VALID_TRANSITIONS.getOrDefault(current, new HashSet<>()).contains(next)) {
            throw new InvalidStatusTransitionException(
                    String.format("Cannot transition from %s to %s", current, next));
        }
    }

    private String resolveUserName(String userId) {
        String safeUserId = Objects.requireNonNull(userId, "userId");
        return userRepository.findById(safeUserId)
                .map(u -> u != null ? u.getName() : safeUserId)
                .orElse(safeUserId);
    }

    private String resolveUserEmail(String userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .map(u -> u != null ? u.getEmail() : null)
                .orElse(null);
    }

    private TicketResponse convertToResponse(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setTitle(ticket.getTitle());
        response.setDescription(ticket.getDescription());
        response.setStatus(ticket.getStatus());
        response.setPriority(ticket.getPriority());
        response.setCategory(ticket.getCategory());
        response.setResourceId(ticket.getResourceId());
        response.setLocation(ticket.getLocation());
        response.setPreferredContact(ticket.getPreferredContact());
        response.setReportedBy(ticket.getReportedBy());
        response.setReportedByName(ticket.getReportedByName());
        response.setReportedByEmail(resolveUserEmail(ticket.getReportedBy()));
        response.setAssignedTo(ticket.getAssignedTo());
        response.setAssignedToName(ticket.getAssignedToName());
        response.setResolutionNotes(ticket.getResolutionNotes());
        response.setRejectionReason(ticket.getRejectionReason());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());
        response.setResolvedAt(ticket.getResolvedAt());
        response.setAttachmentUrls(ticket.getAttachmentUrls());
        response.setComments(ticket.getComments());
        // SLA fields
        response.setSlaDeadline(ticket.getSlaDeadline());
        response.setIsOverdue(ticket.getIsOverdue());
        response.setEscalationLevel(ticket.getEscalationLevel());
        response.setResolvedWithinSla(ticket.getResolvedWithinSla());

        return response;
    }

    private LocalDateTime calculateSLADeadline(TicketPriority priority) {
        LocalDateTime now = LocalDateTime.now();
        int hoursFromNow;

        if (priority == TicketPriority.URGENT) {
            hoursFromNow = 2; // URGENT: 2 hours
        } else if (priority == TicketPriority.HIGH) {
            hoursFromNow = 4; // HIGH: 4 hours
        } else if (priority == TicketPriority.MEDIUM) {
            hoursFromNow = 8; // MEDIUM: 8 hours
        } else { // LOW
            hoursFromNow = 24; // LOW: 24 hours
        }

        return now.plusHours(hoursFromNow);
    }

    private void updateSLAEscalation(Ticket ticket) {
        if (ticket.getStatus() == TicketStatus.RESOLVED ||
                ticket.getStatus() == TicketStatus.REJECTED ||
                ticket.getStatus() == TicketStatus.CLOSED) {
            // No escalation tracking for resolved tickets
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = ticket.getSlaDeadline();

        if (deadline == null) {
            return;
        }

        // Calculate time until deadline
        long minutesUntilDeadline = java.time.temporal.ChronoUnit.MINUTES.between(now, deadline);

        // Update overdue status
        boolean isOverdue = minutesUntilDeadline < 0;
        ticket.setIsOverdue(isOverdue);

        // Determine escalation level
        EscalationLevel level;
        if (isOverdue) {
            level = EscalationLevel.OVERDUE;
        } else if (minutesUntilDeadline <= 30) {
            level = EscalationLevel.CRITICAL;
        } else if (minutesUntilDeadline <= 120) { // 2 hours
            level = EscalationLevel.WARNING;
        } else {
            level = EscalationLevel.NORMAL;
        }

        ticket.setEscalationLevel(level);
    }
}
