package com.smartcampus.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.dto.TicketAssistantContextItem;
import com.smartcampus.backend.dto.TicketAssistantResponse;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.Ticket;
import com.smartcampus.backend.model.TicketAssistantIntent;
import com.smartcampus.backend.model.TicketPriority;
import com.smartcampus.backend.model.TicketStatus;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.TicketRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class TicketAssistantServiceImpl implements TicketAssistantService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${ticket.assistant.ai.enabled:false}")
    private boolean aiEnabled;

    @Value("${ticket.assistant.ai.endpoint:}")
    private String aiEndpoint;

    @Value("${ticket.assistant.ai.api-key:}")
    private String aiApiKey;

    private static final String FALLBACK_MESSAGE = "I couldn't understand that. Try asking about ticket status, SLA, technician assignment, or comments.";

    @Override
    public TicketAssistantResponse handleMessage(String userId, String message) {
        String safeMessage = message == null ? "" : message.trim();
        if (safeMessage.isBlank()) {
            return response(FALLBACK_MESSAGE, "fallback", Map.of());
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Role role = user.getRole();
        TicketAssistantIntent intent = detectIntent(safeMessage);
        List<Ticket> scopedTickets = accessibleTickets(role, userId);
        List<TicketAssistantContextItem> contextItems = buildAccessibleTicketContext(scopedTickets);

        log.info("Ticket assistant request by user {} role {} intent {} contextSize {}", userId, role, intent,
                contextItems.size());

        if (shouldUseAiSummary(safeMessage, intent)) {
            return generateSmartSummaryReply(role, safeMessage, scopedTickets, contextItems);
        }

        return generateDeterministicReply(intent, role, userId, safeMessage);
    }

    private TicketAssistantResponse generateDeterministicReply(TicketAssistantIntent intent, Role role, String userId,
            String safeMessage) {
        return switch (intent) {
            case CHECK_MY_TICKETS -> handleMyTickets(role, userId);
            case CHECK_LATEST_TICKET_STATUS -> handleLatestTicketStatus(role, userId);
            case CHECK_ASSIGNED_TECHNICIAN -> handleAssignedTechnician(role, userId);
            case CHECK_SLA -> handleSla(role, userId);
            case CHECK_OVERDUE_TICKETS -> handleOverdue(role, userId);
            case CHECK_OPEN_TICKETS -> handleOpenTickets(role, userId);
            case CHECK_URGENT_TICKETS -> handleUrgentTickets(role, userId);
            case CHECK_UNASSIGNED_TICKETS -> handleUnassignedTickets(role, userId);
            case CHECK_ASSIGNED_TICKETS -> handleAssignedTickets(role, userId);
            case CHECK_LATEST_COMMENTS -> handleLatestComments(role, userId);
            case CHECK_SLA_SUMMARY -> handleSlaSummary(role, userId);
            case CHECK_NEXT_VALID_STATUS -> handleNextValidStatus(role, userId, safeMessage);
            case HELP_CREATE_TICKET -> response(
                    "To create a ticket: open Incident Ticketing, click New Ticket, add title, category, description, location, contact number, and submit.",
                    "help",
                    Map.of("topic", "create_ticket"));
            case HELP_ATTACHMENTS -> response(
                    "To add evidence, open the ticket form and upload up to 3 images (jpg, jpeg, png). Keep each file within the allowed size.",
                    "help",
                    Map.of("topic", "attachments"));
            case HELP_STATUS_MEANING -> response(
                    "Status guide: OPEN = reported, IN_PROGRESS = technician working, RESOLVED = fix applied, CLOSED = completed, REJECTED = declined with reason.",
                    "help",
                    Map.of("topic", "status_meaning"));
            case UNKNOWN -> response(FALLBACK_MESSAGE, "fallback", Map.of());
        };
    }

    private boolean shouldUseAiSummary(String message, TicketAssistantIntent intent) {
        String text = message.toLowerCase(Locale.ROOT);
        boolean analysisQuestion = text.contains("summarize")
                || text.contains("summary")
                || text.contains("prioritize")
                || text.contains("priority first")
                || text.contains("urgent attention")
                || text.contains("ticket health")
                || text.contains("workload")
                || text.contains("changed recently")
                || text.contains("explain")
                || text.contains("simple language")
                || text.contains("what changed");

        if (analysisQuestion) {
            return true;
        }

        return intent == TicketAssistantIntent.UNKNOWN;
    }

    private List<TicketAssistantContextItem> buildAccessibleTicketContext(List<Ticket> scopedTickets) {
        return scopedTickets.stream()
                .sorted(Comparator.comparing(Ticket::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .limit(20)
                .map(ticket -> new TicketAssistantContextItem(
                        ticket.getId(),
                        ticket.getTitle(),
                        ticket.getStatus(),
                        ticket.getPriority(),
                        ticket.getCategory(),
                        ticket.getCreatedAt(),
                        ticket.getUpdatedAt(),
                        ticket.getAssignedToName(),
                        ticket.getSlaDeadline(),
                        ticket.getEscalationLevel(),
                        isOverdueTicket(ticket),
                        getLatestCommentText(ticket)))
                .toList();
    }

    private TicketAssistantResponse generateSmartSummaryReply(Role role, String question, List<Ticket> scopedTickets,
            List<TicketAssistantContextItem> contextItems) {
        if (scopedTickets.isEmpty()) {
            return response("No tickets found in your current scope.", "ai_summary", Map.of("total", 0));
        }

        long openCount = scopedTickets.stream().filter(this::isOpenTicket).count();
        long urgentCount = scopedTickets.stream().filter(this::isUrgentOrOverdue).count();
        long overdueCount = scopedTickets.stream().filter(this::isOverdueTicket).count();
        long unassignedCount = scopedTickets.stream()
                .filter(this::isOpenTicket)
                .filter(t -> t.getAssignedTo() == null || t.getAssignedTo().isBlank())
                .count();

        Ticket highestPriorityTicket = findMostUrgentTicket(scopedTickets);
        String fallbackSummary = buildFallbackSmartSummary(role, openCount, urgentCount, overdueCount, unassignedCount,
                highestPriorityTicket);

        String smartReply = generateSmartTicketReply(role.name(), question, contextItems, fallbackSummary);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("total", scopedTickets.size());
        data.put("open", openCount);
        data.put("urgent", urgentCount);
        data.put("overdue", overdueCount);
        data.put("unassigned", unassignedCount);
        data.put("recentChanges", buildRecentChangeSummary(scopedTickets));
        if (highestPriorityTicket != null) {
            data.put("highestPriorityTicketId", highestPriorityTicket.getId());
            data.put("highestPriorityTitle", highestPriorityTicket.getTitle());
            data.put("highestPriorityLevel", highestPriorityTicket.getPriority() != null
                    ? highestPriorityTicket.getPriority().name()
                    : "UNKNOWN");
        }

        return response(smartReply, "ai_summary", data);
    }

    private String generateSmartTicketReply(String userRole, String userQuestion,
            List<TicketAssistantContextItem> contextItems,
            String fallbackSummary) {
        if (!aiEnabled || aiEndpoint == null || aiEndpoint.isBlank()) {
            return fallbackSummary;
        }

        try {
            String prompt = buildAiPrompt(userRole, userQuestion, contextItems);
            String aiResponse = callExternalAiProvider(prompt);
            if (aiResponse == null || aiResponse.isBlank()) {
                return fallbackSummary;
            }
            return aiResponse.trim();
        } catch (Exception ex) {
            log.warn("AI summary generation failed, using fallback summary: {}", ex.getMessage());
            return fallbackSummary;
        }
    }

    private String buildAiPrompt(String userRole, String userQuestion, List<TicketAssistantContextItem> contextItems)
            throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("role", userRole);
        payload.put("question", userQuestion);
        payload.put("context", contextItems.stream().map(this::toCompactContextMap).toList());

        return "You are a ticket support assistant for a campus operations system. " +
                "Use only the ticket context provided. Do not invent technicians, statuses, deadlines, or counts. " +
                "If context is insufficient, say so. Keep answer short and practical in user-friendly language.\n" +
                objectMapper.writeValueAsString(payload);
    }

    private Map<String, Object> toCompactContextMap(TicketAssistantContextItem item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("ticketId", item.getTicketId());
        map.put("title", item.getTitle());
        map.put("status", item.getStatus());
        map.put("priority", item.getPriority());
        map.put("category", item.getCategory());
        map.put("updatedAt", item.getUpdatedAt());
        map.put("assignedTechnician", item.getAssignedTechnician());
        map.put("slaDeadline", item.getSlaDeadline());
        map.put("escalationLevel", item.getEscalationLevel());
        map.put("isOverdue", item.getIsOverdue());
        map.put("latestComment", item.getLatestComment());
        return map;
    }

    private String callExternalAiProvider(String prompt) throws IOException {
        URL url = new URL(aiEndpoint);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(7000);
        connection.setReadTimeout(7000);
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json");
        if (aiApiKey != null && !aiApiKey.isBlank()) {
            connection.setRequestProperty("Authorization", "Bearer " + aiApiKey);
        }

        String requestBody = objectMapper.writeValueAsString(Map.of("prompt", prompt));
        try (OutputStream os = connection.getOutputStream()) {
            os.write(requestBody.getBytes(StandardCharsets.UTF_8));
        }

        int status = connection.getResponseCode();
        InputStream stream = status >= 200 && status < 300 ? connection.getInputStream() : connection.getErrorStream();
        if (stream == null) {
            return null;
        }

        String body;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            body = sb.toString();
        }

        if (status < 200 || status >= 300) {
            log.warn("AI provider returned status {} with body {}", status, body);
            return null;
        }

        if (body == null || body.isBlank()) {
            return null;
        }

        try {
            Map<String, Object> parsed = objectMapper.readValue(body, new TypeReference<>() {
            });
            Object reply = parsed.get("reply") != null ? parsed.get("reply") : parsed.get("text");
            if (reply != null) {
                return String.valueOf(reply);
            }
        } catch (Exception ignored) {
            // Accept plain text responses from simple AI provider integrations.
        }

        return body;
    }

    private String buildFallbackSmartSummary(Role role, long openCount, long urgentCount, long overdueCount,
            long unassignedCount, Ticket highestPriorityTicket) {
        String roleScope = role == Role.ADMIN ? "system" : "your";
        String topTicketText = highestPriorityTicket == null
                ? "No immediate critical ticket found."
                : "Top priority ticket is '" + highestPriorityTicket.getTitle() + "' ("
                        + highestPriorityTicket.getPriority() + ").";

        return "Summary for " + roleScope + " tickets: " + openCount + " open, " + urgentCount
                + " urgent/overdue, " + overdueCount + " overdue, " + unassignedCount + " unassigned. "
                + topTicketText;
    }

    private List<String> buildRecentChangeSummary(List<Ticket> scopedTickets) {
        return scopedTickets.stream()
                .sorted(Comparator.comparing(Ticket::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .limit(3)
                .map(t -> t.getTitle() + " -> " + t.getStatus())
                .toList();
    }

    private Ticket findMostUrgentTicket(List<Ticket> tickets) {
        return tickets.stream()
                .filter(this::isOpenTicket)
                .sorted(Comparator
                        .comparing((Ticket t) -> !isOverdueTicket(t))
                        .thenComparingInt(this::priorityRank)
                        .thenComparing(Ticket::getSlaDeadline, Comparator.nullsLast(Comparator.naturalOrder())))
                .findFirst()
                .orElse(null);
    }

    private String getLatestCommentText(Ticket ticket) {
        if (ticket.getComments() == null || ticket.getComments().isEmpty()) {
            return null;
        }

        return ticket.getComments().stream()
                .max(Comparator.comparing(c -> c.getCreatedAt(), Comparator.nullsLast(Comparator.naturalOrder())))
                .map(c -> c.getUserName() + ": " + c.getMessage())
                .orElse(null);
    }

    private boolean isUrgentOrOverdue(Ticket ticket) {
        return ticket.getPriority() == TicketPriority.URGENT || isOverdueTicket(ticket);
    }

    private TicketAssistantIntent detectIntent(String message) {
        String text = message.toLowerCase(Locale.ROOT);

        // Exact quick-action phrases and close variants
        if (text.contains("my open tickets") || text.contains("show my tickets")) {
            return TicketAssistantIntent.CHECK_MY_TICKETS;
        }
        if (text.contains("latest ticket status") || text.contains("what is my latest ticket status")) {
            return TicketAssistantIntent.CHECK_LATEST_TICKET_STATUS;
        }
        if (text.contains("assigned technician") || text.contains("who is assigned technician")) {
            return TicketAssistantIntent.CHECK_ASSIGNED_TECHNICIAN;
        }
        if (text.contains("sla details") || text.contains("show sla deadline")) {
            return TicketAssistantIntent.CHECK_SLA;
        }
        if (text.contains("latest comments") || text.contains("show latest comments")) {
            return TicketAssistantIntent.CHECK_LATEST_COMMENTS;
        }
        if (text.contains("how to report an issue") || text.contains("how to create ticket")) {
            return TicketAssistantIntent.HELP_CREATE_TICKET;
        }
        if (text.contains("how to upload evidence") || text.contains("how to upload attachments")) {
            return TicketAssistantIntent.HELP_ATTACHMENTS;
        }

        if (text.contains("how") && (text.contains("create") || text.contains("report"))) {
            return TicketAssistantIntent.HELP_CREATE_TICKET;
        }
        if (text.contains("upload") || text.contains("attachment") || text.contains("evidence")) {
            return TicketAssistantIntent.HELP_ATTACHMENTS;
        }
        if (text.contains("status") && (text.contains("mean") || text.contains("meaning"))) {
            return TicketAssistantIntent.HELP_STATUS_MEANING;
        }
        if (text.contains("next valid status") || text.contains("next status")) {
            return TicketAssistantIntent.CHECK_NEXT_VALID_STATUS;
        }
        if ((text.contains("latest") || text.contains("recent")) && text.contains("comment")) {
            return TicketAssistantIntent.CHECK_LATEST_COMMENTS;
        }
        if (text.contains("sla summary")) {
            return TicketAssistantIntent.CHECK_SLA_SUMMARY;
        }
        if (text.contains("open ticket") || text.contains("all open")) {
            return TicketAssistantIntent.CHECK_OPEN_TICKETS;
        }
        if (text.contains("assigned") && text.contains("technician")) {
            return TicketAssistantIntent.CHECK_ASSIGNED_TECHNICIAN;
        }
        if (text.contains("latest") && text.contains("status")) {
            return TicketAssistantIntent.CHECK_LATEST_TICKET_STATUS;
        }
        if (text.contains("my") && text.contains("ticket")) {
            return TicketAssistantIntent.CHECK_MY_TICKETS;
        }
        if (text.contains("unassigned")) {
            return TicketAssistantIntent.CHECK_UNASSIGNED_TICKETS;
        }
        if (text.contains("assigned tickets") || text.contains("my assigned")) {
            return TicketAssistantIntent.CHECK_ASSIGNED_TICKETS;
        }
        if (text.contains("urgent") || text.contains("immediate attention")) {
            return TicketAssistantIntent.CHECK_URGENT_TICKETS;
        }
        if (text.contains("overdue")) {
            return TicketAssistantIntent.CHECK_OVERDUE_TICKETS;
        }
        if (text.contains("sla") || text.contains("deadline")) {
            return TicketAssistantIntent.CHECK_SLA;
        }

        return TicketAssistantIntent.UNKNOWN;
    }

    private TicketAssistantResponse handleMyTickets(Role role, String userId) {
        List<Ticket> tickets = accessibleTickets(role, userId);
        long openCount = tickets.stream().filter(this::isOpenTicket).count();
        long overdueCount = tickets.stream().filter(this::isOverdueTicket).count();

        String reply = switch (role) {
            case USER -> "You have " + tickets.size() + " tickets. " + openCount + " are open and " + overdueCount + " are overdue.";
            case TECHNICIAN -> "You have " + tickets.size() + " assigned tickets. " + openCount + " are active and " + overdueCount + " are overdue.";
            case ADMIN -> "There are " + tickets.size() + " total tickets. " + openCount + " are open and " + overdueCount + " are overdue.";
        };

        return response(reply, "ticket_summary", Map.of(
                "total", tickets.size(),
                "open", openCount,
                "overdue", overdueCount));
    }

    private TicketAssistantResponse handleLatestTicketStatus(Role role, String userId) {
        Optional<Ticket> latestTicket = accessibleTickets(role, userId).stream()
                .max(Comparator.comparing(Ticket::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));

        if (latestTicket.isEmpty()) {
            return response("No tickets found yet.", "ticket_summary", Map.of());
        }

        Ticket ticket = latestTicket.get();
        String reply = "Latest ticket '" + ticket.getTitle() + "' is " + ticket.getStatus() + ".";
        return response(reply, "ticket_summary", Map.of(
                "ticketId", ticket.getId(),
                "title", ticket.getTitle(),
                "status", ticket.getStatus().name()));
    }

    private TicketAssistantResponse handleAssignedTechnician(Role role, String userId) {
        List<Ticket> tickets = accessibleTickets(role, userId);
        Optional<Ticket> withAssignee = tickets.stream()
                .filter(t -> t.getAssignedToName() != null && !t.getAssignedToName().isBlank())
                .max(Comparator.comparing(Ticket::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())));

        if (withAssignee.isEmpty()) {
            if (role == Role.USER) {
                return response("None of your tickets have a technician assigned yet.", "ticket_summary", Map.of());
            }
            return response("No assigned technician details found for the current ticket set.", "ticket_summary", Map.of());
        }

        Ticket ticket = withAssignee.get();
        String reply = "Ticket '" + ticket.getTitle() + "' is assigned to technician " + ticket.getAssignedToName() + ".";
        return response(reply, "ticket_summary", Map.of(
                "ticketId", ticket.getId(),
                "assignedTo", ticket.getAssignedToName()));
    }

    private TicketAssistantResponse handleSla(Role role, String userId) {
        List<Ticket> tickets = accessibleTickets(role, userId);
        Optional<Ticket> latest = tickets.stream()
                .filter(this::isOpenTicket)
                .max(Comparator.comparing(Ticket::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())));

        if (latest.isEmpty()) {
            return response("No active tickets with SLA details right now.", "sla_summary", Map.of());
        }

        Ticket ticket = latest.get();
        String slaText = buildSlaText(ticket);
        String reply = "Ticket '" + ticket.getTitle() + "' is " + ticket.getStatus() + ". " + slaText;
        return response(reply, "sla_summary", Map.of(
                "ticketId", ticket.getId(),
                "slaDeadline", ticket.getSlaDeadline(),
                "isOverdue", isOverdueTicket(ticket)));
    }

    private TicketAssistantResponse handleOverdue(Role role, String userId) {
        List<Ticket> overdue = accessibleTickets(role, userId).stream()
                .filter(this::isOverdueTicket)
                .toList();

        if (role == Role.ADMIN) {
            String reply = "There are " + overdue.size() + " overdue tickets requiring admin attention.";
            return response(reply, "sla_summary", Map.of("overdue", overdue.size()));
        }

        String reply = "You have " + overdue.size() + " overdue tickets.";
        return response(reply, "sla_summary", Map.of("overdue", overdue.size()));
    }

    private TicketAssistantResponse handleOpenTickets(Role role, String userId) {
        List<Ticket> open = accessibleTickets(role, userId).stream().filter(this::isOpenTicket).toList();
        if (open.isEmpty()) {
            return response("No open tickets found.", "ticket_summary", Map.of("open", 0));
        }

        Ticket top = open.get(0);
        String rolePrefix = role == Role.ADMIN ? "There are " : "You have ";
        String reply = rolePrefix + open.size() + " open tickets. Example: '" + top.getTitle() + "' (" + top.getStatus() + ").";
        return response(reply, "ticket_summary", Map.of(
                "open", open.size(),
                "sampleTicketId", top.getId()));
    }

    private TicketAssistantResponse handleUrgentTickets(Role role, String userId) {
        List<Ticket> urgent = accessibleTickets(role, userId).stream()
                .filter(t -> t.getPriority() == TicketPriority.URGENT || isOverdueTicket(t))
                .toList();

        if (urgent.isEmpty()) {
            return response("No urgent or overdue tickets found right now.", "ticket_summary", Map.of("urgent", 0));
        }

        Ticket highest = urgent.stream().max(Comparator.comparing(Ticket::getCreatedAt)).orElse(urgent.get(0));
        String reply = "There are " + urgent.size() + " urgent/overdue tickets. Highest attention: '" + highest.getTitle() + "'.";
        return response(reply, "ticket_summary", Map.of(
                "urgent", urgent.size(),
                "topTicketId", highest.getId()));
    }

    private TicketAssistantResponse handleUnassignedTickets(Role role, String userId) {
        if (role != Role.ADMIN) {
            return response("Unassigned ticket summary is available for admins only.", "access_limited", Map.of());
        }

        List<Ticket> unassigned = ticketRepository.findAll().stream()
                .filter(this::isOpenTicket)
                .filter(t -> t.getAssignedTo() == null || t.getAssignedTo().isBlank())
                .toList();

        if (unassigned.isEmpty()) {
            return response("All open tickets currently have an assignee.", "ticket_summary", Map.of("unassigned", 0));
        }

        return response("There are " + unassigned.size() + " unassigned tickets.", "ticket_summary", Map.of("unassigned", unassigned.size()));
    }

    private TicketAssistantResponse handleAssignedTickets(Role role, String userId) {
        if (role == Role.TECHNICIAN) {
            List<Ticket> assigned = ticketRepository.findByAssignedTo(userId);
            if (assigned.isEmpty()) {
                return response("You have no assigned tickets right now.", "ticket_summary", Map.of("assigned", 0));
            }

            Ticket highestPriority = assigned.stream()
                    .min(Comparator.comparingInt(this::priorityRank))
                    .orElse(assigned.get(0));

            String reply = "You have " + assigned.size() + " assigned tickets. Highest priority is '" + highestPriority.getTitle() + "' (" + highestPriority.getPriority() + ").";
            return response(reply, "ticket_summary", Map.of(
                    "assigned", assigned.size(),
                    "highestPriorityTicketId", highestPriority.getId()));
        }

        if (role == Role.ADMIN) {
            long assignedCount = ticketRepository.findAll().stream()
                .filter(this::isOpenTicket)
                    .filter(t -> t.getAssignedTo() != null && !t.getAssignedTo().isBlank())
                    .count();
            return response("" + assignedCount + " tickets are currently assigned to technicians.", "ticket_summary", Map.of("assigned", assignedCount));
        }

        return response("Assigned ticket summary is not applicable for this role.", "access_limited", Map.of());
    }

    private TicketAssistantResponse handleLatestComments(Role role, String userId) {
        List<Ticket> tickets = accessibleTickets(role, userId);
        List<Map<String, Object>> latestComments = new ArrayList<>();

        tickets.forEach(ticket -> {
            if (ticket.getComments() != null) {
                ticket.getComments().forEach(comment -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("ticketId", ticket.getId());
                    item.put("ticketTitle", ticket.getTitle());
                    item.put("userName", comment.getUserName());
                    item.put("message", comment.getMessage());
                    item.put("createdAt", comment.getCreatedAt());
                    latestComments.add(item);
                });
            }
        });

        latestComments.sort((a, b) -> {
            LocalDateTime timeA = (LocalDateTime) a.get("createdAt");
            LocalDateTime timeB = (LocalDateTime) b.get("createdAt");
            return Comparator.nullsLast(LocalDateTime::compareTo).compare(timeB, timeA);
        });

        List<Map<String, Object>> top = latestComments.stream().limit(3).toList();

        if (top.isEmpty()) {
            return response("No comments found in your accessible tickets.", "ticket_comments", Map.of());
        }

        Map<String, Object> first = top.get(0);
        String reply = "Latest comment is on '" + first.get("ticketTitle") + "' by " + first.get("userName") + ": " + first.get("message") + ".";
        return response(reply, "ticket_comments", Map.of("latestComments", top));
    }

    private TicketAssistantResponse handleSlaSummary(Role role, String userId) {
        List<Ticket> tickets = accessibleTickets(role, userId).stream().filter(this::isOpenTicket).toList();
        long overdue = tickets.stream().filter(this::isOverdueTicket).count();
        long warningOrCritical = tickets.stream().filter(this::isWarningOrCritical).count();

        String scopeLabel = role == Role.ADMIN ? "system" : "your";
        String reply = "SLA summary for " + scopeLabel + " tickets: " + tickets.size() + " active, " + warningOrCritical + " in warning/critical, " + overdue + " overdue.";

        return response(reply, "sla_summary", Map.of(
                "active", tickets.size(),
                "warningOrCritical", warningOrCritical,
                "overdue", overdue));
    }

    private TicketAssistantResponse handleNextValidStatus(Role role, String userId, String message) {
        Optional<Ticket> target = resolveTicketFromMessage(role, userId, message);

        if (target.isEmpty()) {
            return response("I could not find a matching ticket. Ask again with a visible ticket context.", "ticket_summary", Map.of());
        }

        Ticket ticket = target.get();
        List<TicketStatus> nextStatuses = getNextStatuses(ticket.getStatus(), role);

        if (nextStatuses.isEmpty()) {
            return response("Ticket '" + ticket.getTitle() + "' has no next valid status transitions.", "ticket_summary", Map.of(
                    "ticketId", ticket.getId(),
                    "nextStatuses", nextStatuses));
        }

        return response("Next valid status for '" + ticket.getTitle() + "' is: " + nextStatuses + ".", "ticket_summary", Map.of(
                "ticketId", ticket.getId(),
                "nextStatuses", nextStatuses));
    }

    private Optional<Ticket> resolveTicketFromMessage(Role role, String userId, String message) {
        String text = message.toLowerCase(Locale.ROOT);
        return accessibleTickets(role, userId).stream()
                .filter(t -> text.contains(t.getId().toLowerCase(Locale.ROOT))
                        || text.contains(t.getTitle().toLowerCase(Locale.ROOT)))
                .findFirst()
                .or(() -> accessibleTickets(role, userId).stream()
                        .max(Comparator.comparing(Ticket::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()))));
    }

    private List<Ticket> accessibleTickets(Role role, String userId) {
        if (role == Role.ADMIN) {
            return ticketRepository.findAll();
        }
        if (role == Role.TECHNICIAN) {
            return ticketRepository.findByAssignedTo(userId);
        }
        return ticketRepository.findByReportedBy(userId);
    }

    private TicketAssistantResponse response(String reply, String type, Map<String, Object> data) {
        return new TicketAssistantResponse(reply, type, data);
    }

    private boolean isOpenTicket(Ticket ticket) {
        return ticket.getStatus() == TicketStatus.OPEN || ticket.getStatus() == TicketStatus.IN_PROGRESS;
    }

    private boolean isTerminal(TicketStatus status) {
        return status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED || status == TicketStatus.REJECTED;
    }

    private boolean isOverdueTicket(Ticket ticket) {
        if (ticket.getSlaDeadline() == null || isTerminal(ticket.getStatus())) {
            return false;
        }
        return LocalDateTime.now().isAfter(ticket.getSlaDeadline());
    }

    private boolean isWarningOrCritical(Ticket ticket) {
        if (ticket.getSlaDeadline() == null || isTerminal(ticket.getStatus())) {
            return false;
        }
        Duration left = Duration.between(LocalDateTime.now(), ticket.getSlaDeadline());
        return !left.isNegative() && left.toMinutes() <= 120;
    }

    private String buildSlaText(Ticket ticket) {
        if (ticket.getSlaDeadline() == null) {
            return "No SLA deadline is available.";
        }

        Duration left = Duration.between(LocalDateTime.now(), ticket.getSlaDeadline());
        long minutes = left.toMinutes();
        if (minutes < 0) {
            return "It is overdue by " + formatDuration(Math.abs(minutes)) + ".";
        }
        return "Time remaining: " + formatDuration(minutes) + ".";
    }

    private String formatDuration(long minutes) {
        long hours = minutes / 60;
        long mins = minutes % 60;
        if (hours > 0) {
            return hours + "h " + mins + "m";
        }
        return mins + "m";
    }

    private int priorityRank(Ticket ticket) {
        if (ticket.getPriority() == TicketPriority.URGENT) return 0;
        if (ticket.getPriority() == TicketPriority.HIGH) return 1;
        if (ticket.getPriority() == TicketPriority.MEDIUM) return 2;
        return 3;
    }

    private List<TicketStatus> getNextStatuses(TicketStatus status, Role role) {
        if (role == Role.TECHNICIAN) {
            if (status == TicketStatus.OPEN) {
                return List.of(TicketStatus.IN_PROGRESS);
            }
            if (status == TicketStatus.IN_PROGRESS) {
                return List.of(TicketStatus.RESOLVED);
            }
            return List.of();
        }

        if (status == TicketStatus.OPEN) {
            return List.of(TicketStatus.IN_PROGRESS, TicketStatus.REJECTED);
        }
        if (status == TicketStatus.IN_PROGRESS) {
            return List.of(TicketStatus.RESOLVED, TicketStatus.REJECTED);
        }
        if (status == TicketStatus.RESOLVED) {
            return List.of(TicketStatus.CLOSED);
        }
        return List.of();
    }
}
