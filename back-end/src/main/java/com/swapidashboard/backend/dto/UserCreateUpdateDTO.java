package com.swapidashboard.backend.dto;

import com.swapidashboard.backend.model.UserRole;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserCreateUpdateDTO {
    @NotBlank(message = "Username cannot be empty")
    @Size(min = 3, message = "Username must contain at least 3 characters")
    private String username;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Invalid email address")
    private String email;

    // La password non è obbligatoria per l'aggiornamento
    @Size(min = 6, message = "Password must contain at least 6 characters")
    private String password;

    @NotNull(message = "Role cannot be null")
    private UserRole role;

    @NotNull(message = "'isActive' status cannot be null")
    private Boolean isActive;
}