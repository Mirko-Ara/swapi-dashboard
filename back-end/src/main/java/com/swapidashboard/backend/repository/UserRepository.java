package com.swapidashboard.backend.repository;

import com.swapidashboard.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    // Spring Data JPA crea automaticamente la query da questo nome di metodo
    Optional<User> findByUsernameOrEmail(String username, String email);
}