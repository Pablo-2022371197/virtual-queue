package mx.edu.uteq.virtual_queue_back.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import mx.edu.uteq.virtual_queue_back.common.UserRole;

public record RegisterRequest(
		@NotBlank @Size(max = 255) String fullName,
		@NotBlank @Email String email,
		@NotBlank @Size(min = 3, max = 100) String username,
		@NotBlank @Size(min = 8, max = 100) String password,
		UserRole role,
		@Size(min = 8, max = 8) String staffRegistrationKey) {
}
