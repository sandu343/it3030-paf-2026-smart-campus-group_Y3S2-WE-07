package com.smartcampus.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketCommentResponse {
    private String id;
    private String userId;
    private String userName;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
