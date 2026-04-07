package com.smartcampus.service;

import com.smartcampus.model.AppConfig;
import com.smartcampus.model.GatePass;
import com.smartcampus.repository.AppConfigRepository;
import com.smartcampus.repository.GatePassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GatePassService {

    @Autowired
    private GatePassRepository repository;

    @Autowired
    private AppConfigRepository configRepository;

    private static final String CONFIG_ID = "singleton";
    private static final String WARDEN_PARENT_VERIFICATION_NUMBER = "9876543210";

    public String getParentVerificationNumber() {
        return WARDEN_PARENT_VERIFICATION_NUMBER;
    }

    // Fetch mentor-required setting
    public boolean isMentorRequired() {
        return configRepository.findById(CONFIG_ID)
                .map(AppConfig::isMentorRequired)
                .orElse(false);
    }

    // Update mentor-required setting
    public void setMentorRequired(boolean required) {
        AppConfig config = configRepository.findById(CONFIG_ID).orElse(new AppConfig());
        config.setId(CONFIG_ID);
        config.setMentorRequired(required);
        configRepository.save(config);
    }

    // Warden reviews the mentor application
    public GatePass reviewMentorApplication(String id, boolean applicable) {
        Optional<GatePass> optional = repository.findById(id);
        if (optional.isPresent()) {
            GatePass pass = optional.get();
            pass.setMentorStatus(applicable ? "APPLICABLE" : "NOT_APPLICABLE");
            return repository.save(pass);
        }
        throw new RuntimeException("Gate pass not found with id: " + id);
    }

    public GatePass setMentorRequirement(String id, boolean required) {
        Optional<GatePass> optional = repository.findById(id);
        if (optional.isPresent()) {
            GatePass pass = optional.get();
            pass.setMentorRequired(required);
            if (!required) {
                pass.setMentorStatus("NONE");
            } else if (pass.getMentorProofImage() != null && !pass.getMentorProofImage().trim().isEmpty()) {
                pass.setMentorStatus("SUBMITTED");
            } else {
                pass.setMentorStatus("REQUESTED");
            }
            return repository.save(pass);
        }
        throw new RuntimeException("Gate pass not found with id: " + id);
    }

    // Warden sends the request back to student for mentor proof upload
    public GatePass requestMentorProof(String id) {
        Optional<GatePass> optional = repository.findById(id);
        if (optional.isPresent()) {
            GatePass pass = optional.get();
            pass.setMentorRequired(true);
            pass.setMentorStatus("REQUESTED");
            return repository.save(pass);
        }
        throw new RuntimeException("Gate pass not found with id: " + id);
    }

    // Student uploads mentor proof image
    public GatePass submitMentorProof(String id, String imageData) {
        Optional<GatePass> optional = repository.findById(id);
        if (optional.isPresent()) {
            GatePass pass = optional.get();
            String proof = imageData == null ? "" : imageData.trim();
            if (proof.isEmpty()) {
                throw new RuntimeException("Mentor proof image is required.");
            }
            pass.setMentorProofImage(proof);
            pass.setMentorRequired(true);
            pass.setMentorStatus("SUBMITTED");
            return repository.save(pass);
        }
        throw new RuntimeException("Gate pass not found with id: " + id);
    }

    // Student applies for gate pass
    public GatePass applyForPass(GatePass gatePass) {
        String parentConsent = gatePass.getParentConsentNote() == null ? "" : gatePass.getParentConsentNote().trim();
        if (parentConsent.isEmpty()) {
            throw new RuntimeException("Parent consent note is mandatory.");
        }
        gatePass.setParentConsentNote(parentConsent);
        gatePass.setParentApprovalStatus("PENDING");
        gatePass.setParentApprovalMode("NONE");
        gatePass.setParentVerifiedAt(null);
        gatePass.setMentorRequired(false);
        if (gatePass.getMentorStatus() == null || gatePass.getMentorStatus().trim().isEmpty()) {
            gatePass.setMentorStatus("NONE");
        }
        gatePass.setStatus("Pending");
        return repository.save(gatePass);
    }

    // Warden views all pending requests
    public List<GatePass> getAllPendingRequests() {
        return repository.findByStatus("Pending").stream()
            .sorted(Comparator.comparing(GatePass::getId, Comparator.nullsLast(String::compareTo)).reversed())
            .filter(pass -> pass.getStudentId() != null)
            .collect(Collectors.toMap(
                GatePass::getStudentId,
                pass -> pass,
                (existing, replacement) -> existing,
                LinkedHashMap::new
            ))
            .values()
            .stream()
            .toList();
    }

    // Warden approves
    public GatePass approvePass(String id) {
        Optional<GatePass> optional = repository.findById(id);
        if (optional.isPresent()) {
            GatePass pass = optional.get();
            String parentStatus = pass.getParentApprovalStatus() == null
                    ? ""
                    : pass.getParentApprovalStatus().trim().toUpperCase();
            if (!"APPROVED".equals(parentStatus)) {
                throw new RuntimeException("Parent approval is mandatory before approving gate pass.");
            }
            if (pass.isMentorRequired()) {
                String mentorStatus = pass.getMentorStatus() == null ? "" : pass.getMentorStatus().trim().toUpperCase();
                if (!"APPLICABLE".equals(mentorStatus)) {
                    throw new RuntimeException("Mentor proof must be reviewed and approved before approving gate pass.");
                }
            }
            pass.setStatus("Approved");
            return repository.save(pass);
        }
        throw new RuntimeException("Gate pass not found with id: " + id);
    }

    // Warden reviews parent approval (mandatory flow)
    public GatePass reviewParentApproval(String id, boolean approved, String mode) {
        Optional<GatePass> optional = repository.findById(id);
        if (optional.isPresent()) {
            GatePass pass = optional.get();
            String normalizedMode = mode == null ? "NONE" : mode.trim().toUpperCase();

            if (approved && !Set.of("CALL", "WHATSAPP").contains(normalizedMode)) {
                throw new RuntimeException("Parent approval mode must be CALL or WHATSAPP.");
            }

            pass.setParentApprovalStatus(approved ? "APPROVED" : "REJECTED");
            pass.setParentApprovalMode(approved ? normalizedMode : "NONE");
            pass.setParentVerifiedAt(LocalDateTime.now());
            return repository.save(pass);
        }
        throw new RuntimeException("Gate pass not found with id: " + id);
    }

    // Warden rejects
    public GatePass rejectPass(String id) {
        Optional<GatePass> optional = repository.findById(id);
        if (optional.isPresent()) {
            GatePass pass = optional.get();
            pass.setStatus("Rejected");
            return repository.save(pass);
        }
        throw new RuntimeException("Gate pass not found with id: " + id);
    }

    // Guard verifies by scanning QR
    public Optional<GatePass> verifyPass(String id) {
        Optional<GatePass> optional = repository.findById(id);
        if (optional.isEmpty()) {
            return Optional.empty();
        }

        GatePass pass = optional.get();
        String status = (pass.getStatus() == null ? "" : pass.getStatus()).toUpperCase();

        // Move approved pass to historical state immediately after scan
        if ("APPROVED".equals(status)) {
            pass.setStatus("Used");
            pass.setScannedAt(LocalDateTime.now());
            repository.save(pass);

            // Guard ko first scan response allow state me dikhao
            pass.setStatus("Approved");
            return Optional.of(pass);
        }

        return Optional.of(pass);
    }

    // Student checks latest pass status
    public Optional<GatePass> getLatestPassByStudentId(String studentId) {
        return Optional.ofNullable(repository.findFirstByStudentIdOrderByIdDesc(studentId));
    }

    public List<GatePass> getStudentHistory(String studentId) {
        return repository.findByStudentIdOrderByIdDesc(studentId);
    }

    public List<GatePass> getWardenHistory() {
        // Fetch matching statuses in specific casing options just in case, but let's use standard capitalized values.
        List<String> statuses = List.of("Approved", "Rejected", "Used", "Exited", "Completed", "APPROVED", "REJECTED", "USED", "EXITED", "COMPLETED");
        List<GatePass> passes = repository.findHistoryForWarden(statuses);
        passes.sort(Comparator.comparing(GatePass::getId, Comparator.nullsLast(String::compareTo)).reversed());
        return passes;
    }

    public List<GatePass> getGuardTodayHistory() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
        return repository.findByScannedAtBetweenOrderByScannedAtDesc(startOfDay, endOfDay);
    }
}


