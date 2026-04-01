package com.smartcampus.service;

import com.smartcampus.model.Warden;
import com.smartcampus.repository.WardenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class WardenService {
    @Autowired
    private WardenRepository wardenRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public Warden createWarden(Warden warden) {
        warden.setPassword(passwordEncoder.encode(warden.getPassword()));
        return wardenRepository.save(warden);
    }

    public List<Warden> getAllWardens() {
        return wardenRepository.findAll();
    }
}
