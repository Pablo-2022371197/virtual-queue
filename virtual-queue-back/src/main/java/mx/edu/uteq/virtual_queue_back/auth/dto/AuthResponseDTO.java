package mx.edu.uteq.virtual_queue_back.auth.dto;

public record AuthResponseDTO(
		String accessToken,
		String refreshToken,
		String tokenType,
		long expiresIn,
		UserSummaryDTO user) {
}
