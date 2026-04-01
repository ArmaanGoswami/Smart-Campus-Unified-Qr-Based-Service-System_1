package com.smartcampus.service;

import com.smartcampus.model.Guard;
import com.smartcampus.repository.GuardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class GuardService {
    @Autowired
    private GuardRepository guardRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public Guard createGuard(Guard guard) {
        guard.setPassword(passwordEncoder.encode(guard.getPassword()));
        return guardRepository.save(guard);
    }

    public List<Guard> getAllGuards() {
        return guardRepository.findAll();
    }
}
