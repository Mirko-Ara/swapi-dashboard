package com.swapidashboard.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // Conterrà la password HASHATA

    @Enumerated(EnumType.STRING) // Salva il ruolo come testo (es. "admin")
    @Column(nullable = false)
    private UserRole role;


    @JsonProperty("isActive")
    @Column(nullable = false)
    private boolean isActive;

    @CreationTimestamp // Gestito automaticamente da Hibernate
    private Instant createdAt;

    @UpdateTimestamp // Gestito automaticamente da Hibernate
    private Instant updatedAt;
}