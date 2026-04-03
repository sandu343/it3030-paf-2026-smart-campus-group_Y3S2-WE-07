package com.smartcampus.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketAssistantResponse {
    private String reply;
    private String type;
    private Map<String, Object> data;
}
