package mx.edu.uteq.virtual_queue_back.place.dto;

import java.time.Instant;
import java.util.UUID;

import mx.edu.uteq.virtual_queue_back.common.CounterLabelMode;

public record PlaceDTO(
		UUID id,
		String name,
		String address,
		String category,
		String description,
		boolean active,
		Instant createdAt,
		int totalCounters,
		CounterLabelMode counterLabelMode) {
}
