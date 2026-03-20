package com.smartcampus.repository;

import com.smartcampus.model.GatePass;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GatePassRepository extends MongoRepository<GatePass, String> {

    // Student ke saare passes dhundho
    List<GatePass> findByStudentId(String studentId);

    // Student history latest-first
    List<GatePass> findByStudentIdOrderByIdDesc(String studentId);

    // Student ka latest pass lao (id desc ObjectId order se latest)
    GatePass findFirstByStudentIdOrderByIdDesc(String studentId);

    // Sirf pending requests (Warden ke liye)
    List<GatePass> findByStatus(String status);

    // Guard scans for audit (today)
    List<GatePass> findByScannedAtBetweenOrderByScannedAtDesc(LocalDateTime start, LocalDateTime end);
}
