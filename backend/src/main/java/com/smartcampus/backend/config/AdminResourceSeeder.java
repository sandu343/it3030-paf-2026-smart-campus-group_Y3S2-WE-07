package com.smartcampus.backend.config;

import com.smartcampus.backend.model.Building;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceStatus;
import com.smartcampus.backend.model.ResourceType;
import com.smartcampus.backend.repository.BuildingRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Profile("local")
public class AdminResourceSeeder implements CommandLineRunner {

    private final BuildingRepository buildingRepository;
    private final ResourceRepository resourceRepository;

    public AdminResourceSeeder(BuildingRepository buildingRepository, ResourceRepository resourceRepository) {
        this.buildingRepository = buildingRepository;
        this.resourceRepository = resourceRepository;
    }

    @Override
    public void run(String... args) {
        if (buildingRepository.count() == 0) {
            Building building = new Building();
            building.setBuildingName("Main Building");
            building.setBlockCount(3);

            Building.Block blockA = new Building.Block();
            blockA.setBlockName("A");
            blockA.setFloorCount(3);

            Building.Block blockB = new Building.Block();
            blockB.setBlockName("B");
            blockB.setFloorCount(2);

            Building.Block blockC = new Building.Block();
            blockC.setBlockName("C");
            blockC.setFloorCount(4);

            building.setBlocks(List.of(blockA, blockB, blockC));
            building.setCreatedAt(LocalDateTime.now());
            building.setUpdatedAt(LocalDateTime.now());

            Building savedBuilding = buildingRepository.save(building);

            if (resourceRepository.count() == 0) {
                Resource resource1 = new Resource();
                resource1.setResourceType(ResourceType.LECTURE_HALL);
                resource1.setBuildingId(savedBuilding.getId());
                resource1.setBuildingName(savedBuilding.getBuildingName());
                resource1.setBlockName("A");
                resource1.setFloorNumber(1);
                resource1.setHallNumber(2);
                resource1.setHallName("A0102");
                resource1.setCapacity(120);
                resource1.setStatus(ResourceStatus.AVAILABLE);
                resource1.setDescription("Main lecture hall with projector");
                resource1.setCreatedAt(LocalDateTime.now());
                resource1.setUpdatedAt(LocalDateTime.now());

                Resource resource2 = new Resource();
                resource2.setResourceType(ResourceType.STUDY_AREA);
                resource2.setBuildingId(savedBuilding.getId());
                resource2.setBuildingName(savedBuilding.getBuildingName());
                resource2.setBlockName("B");
                resource2.setFloorNumber(2);
                resource2.setHallNumber(5);
                resource2.setHallName("B0205");
                resource2.setCapacity(40);
                resource2.setStatus(ResourceStatus.UNDER_MAINTENANCE);
                resource2.setDescription("Quiet study area");
                resource2.setCreatedAt(LocalDateTime.now());
                resource2.setUpdatedAt(LocalDateTime.now());

                resourceRepository.saveAll(List.of(resource1, resource2));
            }
        }
    }
}