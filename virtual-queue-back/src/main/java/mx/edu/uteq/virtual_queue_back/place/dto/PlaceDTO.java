package mx.edu.uteq.virtual_queue_back.place.dto;

import java.time.Instant;
import java.util.UUID;

public record PlaceDTO(
		UUID id,
		String name,
		String address,
		String category,
		String description,
		boolean active,
		Instant createdAt) {
}
