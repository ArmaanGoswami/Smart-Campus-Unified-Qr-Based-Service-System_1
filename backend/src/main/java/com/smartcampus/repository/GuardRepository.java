package com.smartcampus.repository;

import com.smartcampus.model.Guard;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuardRepository extends MongoRepository<Guard, String> {
    Optional<Guard> findByUsername(String username);
    Optional<Guard> findByEmail(String email);
}
