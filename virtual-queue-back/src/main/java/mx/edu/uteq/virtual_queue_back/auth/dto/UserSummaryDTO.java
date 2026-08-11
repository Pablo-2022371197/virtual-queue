package mx.edu.uteq.virtual_queue_back.auth.dto;

import java.util.UUID;

import mx.edu.uteq.virtual_queue_back.common.UserRole;

public record UserSummaryDTO(
		UUID id,
		String username,
		String fullName,
		UserRole role,
		UUID placeId,
		String placeName,
		Integer claimedCounter,
		String claimedCounterLabel) {
}
