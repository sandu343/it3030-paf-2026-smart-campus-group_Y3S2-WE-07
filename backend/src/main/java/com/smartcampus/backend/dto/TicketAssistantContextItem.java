package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.EscalationLevel;
import com.smartcampus.backend.model.TicketPriority;
import com.smartcampus.backend.model.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketAssistantContextItem {
    private String ticketId;
    private String title;
    private TicketStatus status;
    private TicketPriority priority;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String assignedTechnician;
    private LocalDateTime slaDeadline;
    private EscalationLevel escalationLevel;
    private Boolean isOverdue;
    private String latestComment;
}
