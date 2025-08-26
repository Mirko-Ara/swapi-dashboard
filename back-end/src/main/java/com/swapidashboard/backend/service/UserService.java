package com.swapidashboard.backend.service;

import com.swapidashboard.backend.dto.PasswordChangeRequest;
import com.swapidashboard.backend.dto.UserCreateUpdateDTO;
import com.swapidashboard.backend.model.User;
import com.swapidashboard.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;


@Service
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameOrEmail(email, email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email or username: " + email));

        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name().toUpperCase()));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.isActive(),
                true,
                true,
                true,
                authorities
        );
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(UserCreateUpdateDTO userData) {
        userRepository.findByUsernameOrEmail(userData.getUsername(), userData.getEmail())
                .ifPresent(u -> {
                    throw new IllegalStateException("Email or username already exists");
                });

        User newUser = new User();
        newUser.setUsername(userData.getUsername());
        newUser.setEmail(userData.getEmail());
        newUser.setPassword(passwordEncoder.encode(userData.getPassword())); // Hashing!
        newUser.setRole(userData.getRole());
        newUser.setActive(userData.getIsActive());

        return userRepository.save(newUser);
    }


    public User updateUser(UUID id, UserCreateUpdateDTO updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User with id " + id + " not found"));

        user.setUsername(updates.getUsername());
        user.setEmail(updates.getEmail());
        user.setRole(updates.getRole());
        user.setActive(updates.getIsActive());

        if (updates.getPassword() != null && !updates.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updates.getPassword())); // Hashing!
        }

        return userRepository.save(user);
    }

    public void changePassword(String usernameOrEmail, PasswordChangeRequest request) {
        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }


    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User with id " + id + " not found");
        }
        userRepository.deleteById(id);
    }
}