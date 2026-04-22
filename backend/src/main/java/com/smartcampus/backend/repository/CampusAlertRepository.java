package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.CampusAlert;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface CampusAlertRepository extends MongoRepository<CampusAlert, String> {

    List<CampusAlert> findAllByOrderByCreatedAtDesc();

    List<CampusAlert> findByActiveTrueAndPublishAtLessThanEqualAndEndAtGreaterThanOrderByPublishAtAsc(Instant publishAt,
            Instant endAt);
}
