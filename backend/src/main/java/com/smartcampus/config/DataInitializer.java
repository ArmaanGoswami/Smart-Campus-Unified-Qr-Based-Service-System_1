package com.smartcampus.config;

import com.smartcampus.model.Student;
import com.smartcampus.model.Warden;
import com.smartcampus.model.Guard;
import com.smartcampus.repository.StudentRepository;
import com.smartcampus.repository.WardenRepository;
import com.smartcampus.repository.GuardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private WardenRepository wardenRepository;

    @Autowired
    private GuardRepository guardRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Initialize test data only if database is empty
        if (studentRepository.count() == 0) {
            System.out.println("\n📝 Initializing test data...\n");

            // Create test student
            Student student = new Student();
            student.setStudentId("student1");
            student.setName("Test Student");
            student.setEmail("student1@example.com");
            student.setPassword(passwordEncoder.encode("password123"));
            student.setRole("ROLE_STUDENT");
            studentRepository.save(student);
            System.out.println("✅ Created test student: student1 / password123");

            // Create test student 2
            Student student2 = new Student();
            student2.setStudentId("STU123");
            student2.setName("Another Student");
            student2.setEmail("stu123@example.com");
            student2.setPassword(passwordEncoder.encode("password123"));
            student2.setRole("ROLE_STUDENT");
            studentRepository.save(student2);
            System.out.println("✅ Created test student: STU123 / password123");

            // Create test warden
            Warden warden = new Warden();
            warden.setUsername("warden1");
            warden.setName("Test Warden");
            warden.setEmail("warden1@example.com");
            warden.setPassword(passwordEncoder.encode("password123"));
            warden.setRole("ROLE_WARDEN");
            wardenRepository.save(warden);
            System.out.println("✅ Created test warden: warden1 / password123");

            // Create test guard
            Guard guard = new Guard();
            guard.setUsername("guard1");
            guard.setName("Test Guard");
            guard.setEmail("guard1@example.com");
            guard.setPassword(passwordEncoder.encode("password123"));
            guard.setRole("ROLE_GUARD");
            guardRepository.save(guard);
            System.out.println("✅ Created test guard: guard1 / password123");

            System.out.println("\n✅ Test data initialization complete!\n");
        } else {
            System.out.println("\n✓ Database already has data, skipping initialization.\n");
        }
    }
}
