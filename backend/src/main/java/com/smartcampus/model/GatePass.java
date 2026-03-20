package com.smartcampus.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "gate_passes")
public class GatePass {

    @Id
    private String id; // MongoDB String ID (not Long)

    private String studentId;  // e.g. "STU123"
    private String studentName;
    private String reason;
    private String outTime;

    // "Pending", "Approved", "Rejected"
    private String status = "Pending";

    // Guard scan time (history/audit trail ke liye)
    private LocalDateTime scannedAt;

    // Mentor application feature
    // Student mentor letter (entered by student during application)
    private String mentorApplication;

    // Student mentor application ka uploaded photo/image (data URL)
    private String mentorProofImage;

    // Mentor requirement is decided per application
    private boolean mentorRequired;

    // Warden ka review / workflow: "NONE" | "REQUESTED" | "SUBMITTED" | "APPLICABLE" | "NOT_APPLICABLE"
    private String mentorStatus = "NONE";

    // Parent consent is mandatory (hardcoded rule)
    // Student parent approval/consent details yahan submit karega
    private String parentConsentNote;

    // Warden parent approval review: "PENDING" | "APPROVED" | "REJECTED"
    private String parentApprovalStatus = "PENDING";

    // Warden ne parent verification kaunsa mode se ki: "NONE" | "CALL" | "WHATSAPP"
    private String parentApprovalMode = "NONE";

    // Parent verification kab complete hui
    private LocalDateTime parentVerifiedAt;
}


