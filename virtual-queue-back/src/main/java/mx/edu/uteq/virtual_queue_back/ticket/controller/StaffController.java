package mx.edu.uteq.virtual_queue_back.ticket.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
import mx.edu.uteq.virtual_queue_back.ticket.dto.ClaimCounterRequest;
import mx.edu.uteq.virtual_queue_back.ticket.dto.CounterClaimStateDTO;
import mx.edu.uteq.virtual_queue_back.ticket.dto.TicketDTO;
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

	@GetMapping("/counters")
	public CounterClaimStateDTO getCounters() {
		return ticketService.getCounterState();
	}

	@PostMapping("/counters/claim")
	public CounterClaimStateDTO claimCounter(@Valid @RequestBody ClaimCounterRequest request) {
		return ticketService.claimCounter(request);
	}

	@DeleteMapping("/counters/claim")
	public ResponseEntity<Void> releaseCounter() {
		ticketService.releaseCounter();
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/queues/{queueId}/tickets")
	public List<TicketDTO> listTickets(
			@PathVariable UUID queueId,
			@RequestParam(defaultValue = "WAITING") TicketStatus status) {
		return ticketService.listByQueueAndStatus(queueId, status);
	}

	@GetMapping("/queues/{queueId}/last-dismissed")
	public ResponseEntity<TicketDTO> lastDismissed(@PathVariable UUID queueId) {
		TicketDTO ticket = ticketService.getLastDismissed(queueId);
		if (ticket == null) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(ticket);
	}

	@GetMapping("/queues/{queueId}/active-ticket")
	public ResponseEntity<TicketDTO> activeTicket(@PathVariable UUID queueId) {
		TicketDTO ticket = ticketService.getActiveTicket(queueId);
		if (ticket == null) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(ticket);
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
}
