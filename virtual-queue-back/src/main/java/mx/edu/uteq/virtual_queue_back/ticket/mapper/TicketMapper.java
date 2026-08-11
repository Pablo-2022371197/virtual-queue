package mx.edu.uteq.virtual_queue_back.ticket.mapper;

import mx.edu.uteq.virtual_queue_back.common.CounterLabels;
import mx.edu.uteq.virtual_queue_back.ticket.dto.TicketDTO;
import mx.edu.uteq.virtual_queue_back.ticket.entity.Ticket;

public final class TicketMapper {

	private TicketMapper() {
	}

	public static TicketDTO toDto(Ticket ticket, int position, int estimatedMinutes) {
		Integer counter = ticket.getCounterNumber();
		return new TicketDTO(
				ticket.getId(),
				ticket.getQueue().getPlace().getId(),
				ticket.getQueue().getPlace().getName(),
				ticket.getNumber(),
				position,
				estimatedMinutes,
				ticket.getStatus(),
				ticket.getIssuedAt(),
				counter,
				CounterLabels.toLabel(counter));
	}
}
