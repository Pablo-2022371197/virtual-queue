package mx.edu.uteq.virtual_queue_back.ticket.mapper;

import mx.edu.uteq.virtual_queue_back.common.CounterLabelMode;
import mx.edu.uteq.virtual_queue_back.common.CounterLabels;
import mx.edu.uteq.virtual_queue_back.place.entity.Place;
import mx.edu.uteq.virtual_queue_back.ticket.dto.TicketDTO;
import mx.edu.uteq.virtual_queue_back.ticket.entity.Ticket;

public final class TicketMapper {

	private TicketMapper() {
	}

	public static TicketDTO toDto(Ticket ticket, int position, int estimatedMinutes) {
		Integer counter = ticket.getCounterNumber();
		Place place = ticket.getQueue().getPlace();
		CounterLabelMode mode = place != null && place.getCounterLabelMode() != null
				? place.getCounterLabelMode()
				: CounterLabelMode.LETTERS;
		return new TicketDTO(
				ticket.getId(),
				place.getId(),
				place.getName(),
				ticket.getNumber(),
				position,
				estimatedMinutes,
				ticket.getStatus(),
				ticket.getIssuedAt(),
				counter,
				CounterLabels.toLabel(counter, mode));
	}
}
