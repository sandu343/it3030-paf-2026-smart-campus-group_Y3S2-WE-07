package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Building;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface BuildingRepository extends MongoRepository<Building, String> {
    boolean existsByBuildingNameIgnoreCase(String buildingName);

    Optional<Building> findByBuildingNameIgnoreCase(String buildingName);
}