package com.swapidashboard.backend.controller;

import com.swapidashboard.backend.dto.LoginRequest;
import com.swapidashboard.backend.model.User;
import com.swapidashboard.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest loginRequest) {
        Optional<User> authenticatedUser = authService.authenticate(loginRequest.getEmail(), loginRequest.getPassword());
        if (authenticatedUser.isPresent()) {
            User user = authenticatedUser.get();
            String jwtToken = authService.generateTokenForUser(user.getEmail());
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("token", jwtToken);

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("email", user.getEmail());
            userData.put("role", user.getRole());
            userData.put("isActive", user.isActive());
            userData.put("createdAt", user.getCreatedAt());
            userData.put("updatedAt", user.getUpdatedAt());
            response.put("user", userData);
            return ResponseEntity.ok(response);
        } else {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }
}