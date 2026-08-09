package mx.edu.uteq.virtual_queue_back.place.dto;

import java.util.UUID;

public record QueueDTO(
		UUID id,
		UUID placeId,
		String prefix,
		int averageServiceMinutes,
		int openCounters,
		boolean active) {
}
