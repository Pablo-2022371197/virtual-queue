package mx.edu.uteq.virtual_queue_back.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
		@NotBlank String username,
		@NotBlank String password) {
}
