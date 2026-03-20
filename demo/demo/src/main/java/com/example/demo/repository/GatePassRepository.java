package com.example.demo.repository;

import com.example.demo.model.GatePass;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GatePassRepository extends MongoRepository<GatePass, String> {
    List<GatePass> findByStatus(String status);
}
