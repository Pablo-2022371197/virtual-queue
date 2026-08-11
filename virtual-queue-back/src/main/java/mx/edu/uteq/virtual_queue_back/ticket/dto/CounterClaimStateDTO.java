package mx.edu.uteq.virtual_queue_back.ticket.dto;

import java.util.List;

public record CounterClaimStateDTO(
		Integer claimedCounter,
		String claimedCode,
		int totalCounters,
		List<CounterSlotDTO> counters) {
}
