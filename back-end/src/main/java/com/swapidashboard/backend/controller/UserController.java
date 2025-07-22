package com.swapidashboard.backend.controller;

import com.swapidashboard.backend.dto.UserCreateUpdateDTO;
import com.swapidashboard.backend.model.User;
import com.swapidashboard.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
// Abilita le richieste dal tuo frontend (la porta 5173 è lo standard per Vite, 0 3000)
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService){
        this.userService = userService;
    }

    // GET /api/users
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable UUID id) {
        User user = userService.getAllUsers().stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User with id " + id + " not found"));
        return ResponseEntity.ok(user);
    }

    // POST /api/users
    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody UserCreateUpdateDTO userData) {
        User createdUser = userService.createUser(userData);
        return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }

    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable UUID id, @Valid @RequestBody UserCreateUpdateDTO updates) {
        User updatedUser = userService.updateUser(id, updates);
        return ResponseEntity.ok(updatedUser);
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}