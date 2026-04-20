package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.TicketAssistantResponse;

public interface TicketAssistantService {
    TicketAssistantResponse handleMessage(String userId, String message);
}
