package mx.edu.uteq.virtual_queue_back.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
		@NotBlank @Size(max = 255) String fullName,
		@NotBlank @Size(min = 3, max = 100) String username) {
}
