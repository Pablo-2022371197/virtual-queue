package mx.edu.uteq.virtual_queue_back.place.dto;

import java.util.UUID;

public record PlaceStatsDTO(
		UUID placeId,
		int activeTickets,
		int averageWaitMinutes,
		int openCounters,
		String turnCalled) {
}
