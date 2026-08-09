package mx.edu.uteq.virtual_queue_back.ticket.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import mx.edu.uteq.virtual_queue_back.common.TicketStatus;
import mx.edu.uteq.virtual_queue_back.place.dto.PlaceDTO;
import mx.edu.uteq.virtual_queue_back.ticket.dto.AcceptTicketRequest;
import mx.edu.uteq.virtual_queue_back.ticket.dto.TicketDTO;
import mx.edu.uteq.virtual_queue_back.ticket.dto.UpdateQueueSettingsRequest;
import mx.edu.uteq.virtual_queue_back.ticket.service.TicketService;

@RestController
@RequestMapping("/api/staff")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffController {

	private final TicketService ticketService;

	public StaffController(TicketService ticketService) {
		this.ticketService = ticketService;
	}

	@GetMapping("/place")
	public PlaceDTO getAssignedPlace() {
		return ticketService.getStaffAssignedPlace();
	}

	@GetMapping("/queues/{queueId}/tickets")
	public List<TicketDTO> listTickets(
			@PathVariable UUID queueId,
			@RequestParam(defaultValue = "WAITING") TicketStatus status) {
		return ticketService.listByQueueAndStatus(queueId, status);
	}

	@PostMapping("/queues/{queueId}/call-next")
	public TicketDTO callNext(@PathVariable UUID queueId) {
		return ticketService.callNext(queueId);
	}

	@PostMapping("/tickets/{ticketId}/accept")
	public TicketDTO accept(
			@PathVariable UUID ticketId,
			@RequestBody(required = false) @Valid AcceptTicketRequest request) {
		return ticketService.acceptTicket(ticketId, request);
	}

	@PostMapping("/tickets/{ticketId}/start")
	public TicketDTO start(@PathVariable UUID ticketId) {
		return ticketService.startService(ticketId);
	}

	@PostMapping("/tickets/{ticketId}/complete")
	public TicketDTO complete(@PathVariable UUID ticketId) {
		return ticketService.complete(ticketId);
	}

	@PostMapping("/tickets/{ticketId}/expire")
	public TicketDTO expire(@PathVariable UUID ticketId) {
		return ticketService.expire(ticketId);
	}

	@PatchMapping("/queues/{queueId}")
	public void updateQueue(@PathVariable UUID queueId, @Valid @RequestBody UpdateQueueSettingsRequest request) {
		ticketService.updateQueueSettings(queueId, request);
	}
}
