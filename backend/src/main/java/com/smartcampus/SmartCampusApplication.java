package com.smartcampus;

import com.smartcampus.model.Guard;
import com.smartcampus.model.Student;
import com.smartcampus.model.Warden;
import com.smartcampus.repository.GuardRepository;
import com.smartcampus.repository.StudentRepository;
import com.smartcampus.repository.WardenRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class SmartCampusApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartCampusApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedData(StudentRepository studentRepo, WardenRepository wardenRepo, GuardRepository guardRepo, PasswordEncoder encoder) {
        return args -> {
            if (studentRepo.findByStudentId("STU123").isEmpty()) {
                studentRepo.save(new Student(null, "STU123", "Amit Kumar", "student@campus.com", encoder.encode("pass123"), "ROLE_STUDENT"));
            }
            if (wardenRepo.findByUsername("warden").isEmpty()) {
                wardenRepo.save(new Warden(null, "warden", "Warden Sahab", "warden@campus.com", encoder.encode("warden123"), "ROLE_WARDEN"));
            }
            if (guardRepo.findByUsername("guard").isEmpty()) {
                guardRepo.save(new Guard(null, "guard", "Guard Bhaiya", "guard@campus.com", encoder.encode("guard123"), "ROLE_GUARD"));
            }
        };
    }
}
