package com.smartcampus.controller;

import com.smartcampus.model.GatePass;
import com.smartcampus.service.GatePassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/gate-pass")
@CrossOrigin(origins = "*") 
public class GatePassController {

    @Autowired
    private GatePassService service;

    // POST /api/gate-pass  -> Student applies
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<GatePass> applyForPass(@RequestBody GatePass gatePass) {
        GatePass saved = service.applyForPass(gatePass);
        return ResponseEntity.ok(saved);
    }

    // GET /api/gate-pass/pending  -> Warden views pending list
    @GetMapping("/pending")
    @PreAuthorize("hasRole('WARDEN')")
    public ResponseEntity<List<GatePass>> getPendingRequests() {
        return ResponseEntity.ok(service.getAllPendingRequests());
    }

    // GET /api/gate-pass/student/{studentId}  -> Student views latest status
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getStudentLatestPass(@PathVariable String studentId) {
        Optional<GatePass> pass = service.getLatestPassByStudentId(studentId);
        if (pass.isPresent()) {
            return ResponseEntity.ok(pass.get());
        }
        return ResponseEntity.status(404).body("No gate pass found for student.");
    }

    // GET /api/gate-pass/student/{studentId}/history  -> Student full audit trail
    @GetMapping("/student/{studentId}/history")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<GatePass>> getStudentHistory(@PathVariable String studentId) {
        return ResponseEntity.ok(service.getStudentHistory(studentId));
    }

    // PUT /api/gate-pass/{id}/approve  -> Warden approves
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('WARDEN')")
    public ResponseEntity<GatePass> approvePass(@PathVariable String id) {
        return ResponseEntity.ok(service.approvePass(id));
    }

    // PUT /api/gate-pass/{id}/reject  -> Warden rejects
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('WARDEN')")
    public ResponseEntity<GatePass> rejectPass(@PathVariable String id) {
        return ResponseEntity.ok(service.rejectPass(id));
    }

    // GET /api/gate-pass/{id}/verify  -> Guard verifies by QR scan
    @GetMapping("/{id}/verify")
    @PreAuthorize("hasRole('GUARD')")
    public ResponseEntity<?> verifyPass(@PathVariable String id) {
        Optional<GatePass> pass = service.verifyPass(id);
        if (pass.isPresent()) {
            return ResponseEntity.ok(pass.get());
        }
        return ResponseEntity.status(404).body("Invalid or expired QR code.");
    }

    // GET /api/gate-pass/history  -> Warden history logs
    @GetMapping("/history")
    @PreAuthorize("hasRole('WARDEN')")
    public ResponseEntity<List<GatePass>> getWardenHistory() {
        return ResponseEntity.ok(service.getWardenHistory());
    }

    // GET /api/gate-pass/guard/history  -> Guard today's scans
    @GetMapping("/guard/history")
    @PreAuthorize("hasRole('GUARD')")
    public ResponseEntity<List<GatePass>> getGuardTodayHistory() {
        return ResponseEntity.ok(service.getGuardTodayHistory());
    }

    // GET /api/gate-pass/config/mentor-required  -> Read mentor-required setting
    @GetMapping("/config/mentor-required")
    public ResponseEntity<Map<String, Boolean>> getMentorRequired() {
        return ResponseEntity.ok(Map.of("mentorRequired", service.isMentorRequired()));
    }

    // PUT /api/gate-pass/config/mentor-required?value=true  -> Warden sets setting
    @PutMapping("/config/mentor-required")
    public ResponseEntity<Map<String, Boolean>> setMentorRequired(@RequestParam boolean value) {
        service.setMentorRequired(value);
        return ResponseEntity.ok(Map.of("mentorRequired", value));
    }

    // GET /api/gate-pass/config/parent-verification  -> Warden configured number
    @GetMapping("/config/parent-verification")
    public ResponseEntity<Map<String, String>> getParentVerificationConfig() {
        return ResponseEntity.ok(Map.of(
                "verificationNumber", service.getParentVerificationNumber(),
                "policy", "PARENT_APPROVAL_MANDATORY"
        ));
    }

    // PUT /api/gate-pass/{id}/mentor-review?applicable=true  -> Warden reviews mentor data
    @PutMapping("/{id}/mentor-review")
    public ResponseEntity<GatePass> reviewMentorApplication(
            @PathVariable String id,
            @RequestParam boolean applicable) {
        return ResponseEntity.ok(service.reviewMentorApplication(id, applicable));
    }

    // PUT /api/gate-pass/{id}/mentor-requirement?required=true  -> Decide mentor requirement per request
    @PutMapping("/{id}/mentor-requirement")
    public ResponseEntity<GatePass> setMentorRequirement(
            @PathVariable String id,
            @RequestParam boolean required) {
        return ResponseEntity.ok(service.setMentorRequirement(id, required));
    }

    // PUT /api/gate-pass/{id}/mentor-request  -> Request mentor proof from student
    @PutMapping("/{id}/mentor-request")
    public ResponseEntity<GatePass> requestMentorProof(@PathVariable String id) {
        return ResponseEntity.ok(service.requestMentorProof(id));
    }

    // PUT /api/gate-pass/{id}/mentor-upload  -> Student uploads mentor proof image
    @PutMapping("/{id}/mentor-upload")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<GatePass> uploadMentorProof(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(service.submitMentorProof(id, payload.get("mentorProofImage")));
    }

    // PUT /api/gate-pass/{id}/parent-review?approved=true  -> Warden reviews parent approval
    @PutMapping("/{id}/parent-review")
    public ResponseEntity<GatePass> reviewParentApproval(
            @PathVariable String id,
            @RequestParam boolean approved,
            @RequestParam(defaultValue = "NONE") String mode) {
        return ResponseEntity.ok(service.reviewParentApproval(id, approved, mode));
    }
}


