package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Ticket;
import com.smartcampus.backend.model.TicketStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {
    List<Ticket> findByReportedBy(String userId);
    List<Ticket> findByStatus(TicketStatus status);
    List<Ticket> findByReportedByOrAssignedTo(String userId, String assignedToId);
    List<Ticket> findByAssignedTo(String assignedToId);
}
