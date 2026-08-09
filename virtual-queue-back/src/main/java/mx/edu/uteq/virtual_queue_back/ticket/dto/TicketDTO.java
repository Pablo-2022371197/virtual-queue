package mx.edu.uteq.virtual_queue_back.ticket.dto;

import java.time.Instant;
import java.util.UUID;

import mx.edu.uteq.virtual_queue_back.common.TicketStatus;

public record TicketDTO(
		UUID id,
		UUID placeId,
		String placeName,
		String number,
		int position,
		int estimatedMinutes,
		TicketStatus status,
		Instant issuedAt,
		Integer counterNumber) {
}
