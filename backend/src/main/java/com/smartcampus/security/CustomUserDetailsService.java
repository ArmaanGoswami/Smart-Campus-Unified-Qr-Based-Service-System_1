package com.smartcampus.security;

import com.smartcampus.model.Guard;
import com.smartcampus.model.Student;
import com.smartcampus.model.Warden;
import com.smartcampus.repository.GuardRepository;
import com.smartcampus.repository.StudentRepository;
import com.smartcampus.repository.WardenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired private StudentRepository studentRepository;
    @Autowired private WardenRepository wardenRepository;
    @Autowired private GuardRepository guardRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Check Student
        Optional<Student> student = studentRepository.findByStudentId(username);
        if (student.isPresent()) {
            return new User(student.get().getStudentId(), student.get().getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority(student.get().getRole())));
        }

        // 2. Check Warden
        Optional<Warden> warden = wardenRepository.findByUsername(username);
        if (warden.isPresent()) {
            return new User(warden.get().getUsername(), warden.get().getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority(warden.get().getRole())));
        }

        // 3. Check Guard
        Optional<Guard> guard = guardRepository.findByUsername(username);
        if (guard.isPresent()) {
            return new User(guard.get().getUsername(), guard.get().getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority(guard.get().getRole())));
        }

        throw new UsernameNotFoundException("User not found: " + username);
    }
}
