package com.smartcampus.repository;

import com.smartcampus.model.AppConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppConfigRepository extends MongoRepository<AppConfig, String> {
}
