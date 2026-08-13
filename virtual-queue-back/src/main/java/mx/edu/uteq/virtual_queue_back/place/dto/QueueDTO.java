package mx.edu.uteq.virtual_queue_back.place.dto;

import java.util.UUID;

import mx.edu.uteq.virtual_queue_back.common.CounterLabelMode;

public record QueueDTO(
		UUID id,
		UUID placeId,
		String prefix,
		int averageServiceMinutes,
		int openCounters,
		int totalCounters,
		boolean active,
		CounterLabelMode counterLabelMode) {
}
