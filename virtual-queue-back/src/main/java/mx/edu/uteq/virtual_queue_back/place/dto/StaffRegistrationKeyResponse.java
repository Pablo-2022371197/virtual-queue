package mx.edu.uteq.virtual_queue_back.place.dto;

import java.util.UUID;

public record StaffRegistrationKeyResponse(
		UUID placeId,
		String placeName,
		String staffRegistrationKey) {
}
