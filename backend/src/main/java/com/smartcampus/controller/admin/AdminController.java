package com.smartcampus.controller.admin;

import com.smartcampus.model.Warden;
import com.smartcampus.model.Guard;
import com.smartcampus.model.Student;
import com.smartcampus.service.WardenService;
import com.smartcampus.service.GuardService;
import com.smartcampus.service.StudentService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private WardenService wardenService;
    @Autowired
    private GuardService guardService;
    @Autowired
    private StudentService studentService;

    @PostMapping("/create-warden")
    public ResponseEntity<?> createWarden(@RequestBody Warden warden) {
        Warden saved = wardenService.createWarden(warden);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/create-guard")
    public ResponseEntity<?> createGuard(@RequestBody Guard guard) {
        Guard saved = guardService.createGuard(guard);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/create-student")
    public ResponseEntity<?> createStudent(@RequestBody Student student) {
        Student saved = studentService.createStudent(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/list-wardens")
    public ResponseEntity<List<Warden>> listWardens() {
        return ResponseEntity.ok(wardenService.getAllWardens());
    }

    @GetMapping("/list-guards")
    public ResponseEntity<List<Guard>> listGuards() {
        return ResponseEntity.ok(guardService.getAllGuards());
    }

    @GetMapping("/list-students")
    public ResponseEntity<List<Student>> listStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }
}
