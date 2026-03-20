package com.example.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "gate_pass")
public class GatePass {

    @Id
    private String id;

    private String studentId;

    private String reason;

    private String outTime;

    private String status = "Pending";

    // No-args constructor
    public GatePass() {
    }

    // All-args constructor
    public GatePass(String studentId, String reason, String outTime, String status) {
        this.studentId = studentId;
        this.reason = reason;
        this.outTime = outTime;
        this.status = status;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getOutTime() {
        return outTime;
    }

    public void setOutTime(String outTime) {
        this.outTime = outTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
