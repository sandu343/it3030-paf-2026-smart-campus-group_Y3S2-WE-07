package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.*;
import java.util.List;

public interface TicketService {
    TicketResponse createTicket(CreateTicketRequest request, String userId);
    TicketResponse getTicket(String ticketId);
    List<TicketResponse> getMyTickets(String userId);
    List<TicketResponse> getAllTickets();
    List<TicketResponse> getAssignedTickets(String userId);
    TicketResponse updateTicketStatus(String ticketId, UpdateTicketStatusRequest request, String userId);
    TicketResponse assignTicket(String ticketId, String assignToUserId);
    TicketResponse addComment(String ticketId, TicketCommentRequest request, String userId);
    TicketResponse updateComment(String ticketId, String commentId, TicketCommentRequest request, String userId);
    TicketResponse deleteComment(String ticketId, String commentId, String userId);
}
