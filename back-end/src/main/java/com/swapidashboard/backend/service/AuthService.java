package com.swapidashboard.backend.service;

import com.swapidashboard.backend.model.User;
import com.swapidashboard.backend.repository.UserRepository;
import com.swapidashboard.backend.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;


    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder
            , AuthenticationManager authenticationManager
            ,UserDetailsService userDetailsService, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    public Optional<User> authenticate(String email, String rawPassword) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, rawPassword)
            );
            return userRepository.findByUsernameOrEmail(email, email);
        } catch(AuthenticationException e) {
            System.err.println("Authentication failed for user " + email + ": " + e.getMessage());
            return Optional.empty();
        }
    }

    public String generateTokenForUser(String email) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        return jwtUtil.generateToken(userDetails);
    }
}