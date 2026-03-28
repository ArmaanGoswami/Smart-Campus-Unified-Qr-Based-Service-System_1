package com.smartcampus.repository;

import com.smartcampus.model.Student;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends MongoRepository<Student, String> {
    Optional<Student> findByStudentId(String studentId);
    Optional<Student> findByEmail(String email);
}
