package com.smartcampus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {
    @Id
    private String id;

    private String title;
    private String resourceId;
    private String location;
    private String category;
    private String description;
    private TicketPriority priority;
    private TicketStatus status;

    private String reportedBy;
    private String reportedByName;
    private String assignedTo;
    private String assignedToName;

    private String preferredContact;
    private String resolutionNotes;
    private String rejectionReason;

    private List<String> attachmentUrls;
    private List<TicketComment> comments;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;

    // SLA-related fields for Member 3 novelty feature
    private LocalDateTime slaDeadline; // Auto-calculated deadline based on priority
    private EscalationLevel escalationLevel; // Current escalation status (NORMAL, WARNING, CRITICAL, OVERDUE)
    private Boolean isOverdue; // Tracks if SLA deadline has been exceeded
    private Boolean resolvedWithinSla; // Records if ticket was resolved before deadline

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
