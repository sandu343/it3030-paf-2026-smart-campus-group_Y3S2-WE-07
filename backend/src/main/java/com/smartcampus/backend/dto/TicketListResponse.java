package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.TicketStatus;
import com.smartcampus.backend.model.TicketPriority;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketListResponse {
    private String id;
    private String title;
    private String category;
    private TicketPriority priority;
    private TicketStatus status;
    private String reportedByName;
    private String assignedToName;
    private Integer commentCount;
    private LocalDateTime createdAt;
}
