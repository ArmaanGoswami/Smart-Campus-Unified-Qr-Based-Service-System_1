package com.example.demo.controller;

import com.example.demo.model.GatePass;
import com.example.demo.repository.GatePassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/gatepass")
@CrossOrigin(origins = "*")
public class GatePassController {

    @Autowired
    private GatePassRepository gatePassRepository;

    /**
     * POST endpoint to apply for a gate pass
     * Accepts a GatePass object and saves it to the database
     */
    @PostMapping("/apply")
    public GatePass applyGatePass(@RequestBody GatePass gatePass) {
        return gatePassRepository.save(gatePass);
    }

    /**
     * GET endpoint to retrieve all pending gate passes
     * Returns a list of GatePasses with status "Pending"
     */
    @GetMapping("/pending")
    public List<GatePass> getPendingGatePasses() {
        return gatePassRepository.findByStatus("Pending");
    }

    /**
     * PUT endpoint to update the status of a gate pass
     * Accepts the gate pass id and new status via request parameter
     */
    @PutMapping("/update/{id}")
    public GatePass updateGatePassStatus(@PathVariable String id, @RequestParam String status) {
        Optional<GatePass> gatePassOptional = gatePassRepository.findById(id);
        
        if (gatePassOptional.isPresent()) {
            GatePass gatePass = gatePassOptional.get();
            gatePass.setStatus(status);
            return gatePassRepository.save(gatePass);
        }
        
        return null;
    }
}
