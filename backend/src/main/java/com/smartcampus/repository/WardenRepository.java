package com.smartcampus.repository;

import com.smartcampus.model.Warden;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WardenRepository extends MongoRepository<Warden, String> {
    Optional<Warden> findByUsername(String username);
    Optional<Warden> findByEmail(String email);
}
