package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ResourceRepository extends MongoRepository<Resource, String> {
    boolean existsByHallNameIgnoreCase(String hallName);

    Optional<Resource> findByHallNameIgnoreCase(String hallName);

    List<Resource> findByBuildingId(String buildingId);

    boolean existsByBuildingId(String buildingId);

    long countByBuildingId(String buildingId);
}