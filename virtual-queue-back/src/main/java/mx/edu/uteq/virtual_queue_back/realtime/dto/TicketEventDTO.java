package mx.edu.uteq.virtual_queue_back.realtime.dto;

import java.time.Instant;
import java.util.UUID;

import mx.edu.uteq.virtual_queue_back.common.TicketStatus;
import mx.edu.uteq.virtual_queue_back.ticket.dto.TicketDTO;

public record TicketEventDTO(
		UUID eventId,
		String type,
		Instant occurredAt,
		TicketEventPayload ticket) {

	public static TicketEventDTO ticketUpdated(TicketDTO ticket) {
		return new TicketEventDTO(
				UUID.randomUUID(),
				"TICKET_UPDATED",
				Instant.now(),
				new TicketEventPayload(
						ticket.id(),
						ticket.placeId(),
						ticket.placeName(),
						ticket.number(),
						ticket.position(),
						ticket.estimatedMinutes(),
						ticket.status(),
						ticket.issuedAt(),
						ticket.counterNumber(),
						ticket.counterLabel()));
	}

	public record TicketEventPayload(
			UUID id,
			UUID placeId,
			String placeName,
			String number,
			int position,
			int estimatedMinutes,
			TicketStatus status,
			Instant issuedAt,
			Integer counterNumber,
			String counterLabel) {
	}
}
