package com.smartcampus.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.badRequest().body(Map.of(
                "error", "Bad Request",
                "message", e.getMessage()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        return ResponseEntity.status(500).body(Map.of(
                "error", "Internal Server Error",
                "message", "An unexpected error occurred: " + e.getMessage()
        ));
    }
}
