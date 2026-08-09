package mx.edu.uteq.virtual_queue_back.ticket.dto;

import jakarta.validation.constraints.Min;

public record AcceptTicketRequest(
		@Min(1) Integer counterNumber) {
}
