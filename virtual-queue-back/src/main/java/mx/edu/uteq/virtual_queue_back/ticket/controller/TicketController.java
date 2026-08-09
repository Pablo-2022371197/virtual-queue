package mx.edu.uteq.virtual_queue_back.ticket.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import mx.edu.uteq.virtual_queue_back.ticket.dto.TicketDTO;
import mx.edu.uteq.virtual_queue_back.ticket.service.TicketService;

@RestController
@RequestMapping("/api")
public class TicketController {

	private final TicketService ticketService;

	public TicketController(TicketService ticketService) {
		this.ticketService = ticketService;
	}

	@PostMapping("/places/{placeId}/tickets")
	@org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
	public TicketDTO takeTicket(@PathVariable UUID placeId) {
		return ticketService.takeTicket(placeId);
	}

	@GetMapping("/tickets/mine")
	public ResponseEntity<TicketDTO> getMine() {
		TicketDTO ticket = ticketService.getMine();
		if (ticket == null) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(ticket);
	}

	@GetMapping("/tickets/{ticketId}")
	public TicketDTO getById(@PathVariable UUID ticketId) {
		return ticketService.getById(ticketId);
	}

	@DeleteMapping("/tickets/{ticketId}")
	public TicketDTO cancel(@PathVariable UUID ticketId) {
		return ticketService.cancel(ticketId);
	}
}
