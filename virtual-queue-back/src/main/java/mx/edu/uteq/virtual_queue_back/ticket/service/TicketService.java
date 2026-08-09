package mx.edu.uteq.virtual_queue_back.ticket.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import mx.edu.uteq.virtual_queue_back.common.BusinessException;
import mx.edu.uteq.virtual_queue_back.common.ErrorCode;
import mx.edu.uteq.virtual_queue_back.common.TicketStatus;
import mx.edu.uteq.virtual_queue_back.common.UserRole;
import mx.edu.uteq.virtual_queue_back.notification.FcmNotificationService;
import mx.edu.uteq.virtual_queue_back.place.dto.PlaceDTO;
import mx.edu.uteq.virtual_queue_back.place.dto.PlaceStatsDTO;
import mx.edu.uteq.virtual_queue_back.place.entity.Place;
import mx.edu.uteq.virtual_queue_back.place.mapper.PlaceMapper;
import mx.edu.uteq.virtual_queue_back.place.service.PlaceService;
import mx.edu.uteq.virtual_queue_back.queue.entity.ServiceQueue;
import mx.edu.uteq.virtual_queue_back.queue.repository.ServiceQueueRepository;
import mx.edu.uteq.virtual_queue_back.realtime.RealtimeEventPublisher;
import mx.edu.uteq.virtual_queue_back.security.SecurityUtils;
import mx.edu.uteq.virtual_queue_back.security.UserPrincipal;
import mx.edu.uteq.virtual_queue_back.ticket.dto.AcceptTicketRequest;
import mx.edu.uteq.virtual_queue_back.ticket.dto.TicketDTO;
import mx.edu.uteq.virtual_queue_back.ticket.dto.UpdateQueueSettingsRequest;
import mx.edu.uteq.virtual_queue_back.ticket.entity.Ticket;
import mx.edu.uteq.virtual_queue_back.ticket.mapper.TicketMapper;
import mx.edu.uteq.virtual_queue_back.ticket.repository.TicketRepository;
import mx.edu.uteq.virtual_queue_back.user.entity.User;
import mx.edu.uteq.virtual_queue_back.user.repository.UserRepository;

@Service
public class TicketService {

	private final TicketRepository ticketRepository;
	private final ServiceQueueRepository queueRepository;
	private final UserRepository userRepository;
	private final PlaceService placeService;
	private final RealtimeEventPublisher realtimeEventPublisher;
	private final FcmNotificationService fcmNotificationService;

	public TicketService(
			TicketRepository ticketRepository,
			ServiceQueueRepository queueRepository,
			UserRepository userRepository,
			PlaceService placeService,
			RealtimeEventPublisher realtimeEventPublisher,
			FcmNotificationService fcmNotificationService) {
		this.ticketRepository = ticketRepository;
		this.queueRepository = queueRepository;
		this.userRepository = userRepository;
		this.placeService = placeService;
		this.realtimeEventPublisher = realtimeEventPublisher;
		this.fcmNotificationService = fcmNotificationService;
	}

	@Transactional
	public TicketDTO takeTicket(UUID placeId) {
		UserPrincipal principal = SecurityUtils.currentUser();
		User user = userRepository.findById(principal.getId()).orElseThrow();

		if (ticketRepository.findActiveByUserId(user.getId(), TicketStatus.ACTIVE).isPresent()) {
			throw new BusinessException(ErrorCode.ACTIVE_TICKET_EXISTS, "User already has an active ticket");
		}

		var place = placeService.findPlace(placeId);
		if (!place.isActive()) {
			throw new BusinessException(ErrorCode.PLACE_NOT_ACTIVE, "Place is not active");
		}

		ServiceQueue queue = queueRepository.findByPlaceId(placeId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "Queue not found", HttpStatus.NOT_FOUND));

		if (!queue.isActive()) {
			throw new BusinessException(ErrorCode.QUEUE_NOT_ACTIVE, "Queue is not active");
		}

		if (ticketRepository.existsByQueueIdAndUserIdAndStatusIn(queue.getId(), user.getId(), TicketStatus.ACTIVE)) {
			throw new BusinessException(ErrorCode.QUEUE_ALREADY_JOINED, "Already in this queue");
		}

		ServiceQueue lockedQueue = queueRepository.findByIdForUpdate(queue.getId()).orElseThrow();
		int sequence = lockedQueue.getLastSequence() + 1;
		lockedQueue.setLastSequence(sequence);
		queueRepository.save(lockedQueue);

		Ticket ticket = Ticket.builder()
				.id(UUID.randomUUID())
				.queue(lockedQueue)
				.user(user)
				.sequence(sequence)
				.number(formatNumber(lockedQueue.getPrefix(), sequence))
				.status(TicketStatus.WAITING)
				.issuedAt(Instant.now())
				.build();

		ticketRepository.save(ticket);
		updateNearlyStatus(lockedQueue.getId());
		return publishChanges(ticket);
	}

	public TicketDTO getMine() {
		UserPrincipal principal = SecurityUtils.currentUser();
		return ticketRepository.findActiveByUserId(principal.getId(), TicketStatus.ACTIVE)
				.map(this::toDtoWithMetrics)
				.orElse(null);
	}

	public TicketDTO getById(UUID ticketId) {
		Ticket ticket = findTicket(ticketId);
		assertCanView(ticket);
		return toDtoWithMetrics(ticket);
	}

	@Transactional
	public TicketDTO cancel(UUID ticketId) {
		Ticket ticket = findTicket(ticketId);
		UserPrincipal principal = SecurityUtils.currentUser();

		if (!ticket.getUser().getId().equals(principal.getId())) {
			throw new BusinessException(ErrorCode.FORBIDDEN, "Cannot cancel another user's ticket", HttpStatus.FORBIDDEN);
		}

		transition(ticket, TicketStatus.CANCELLED);
		ticket.setCancelledAt(Instant.now());
		ticketRepository.save(ticket);
		updateNearlyStatus(ticket.getQueue().getId());
		return publishChanges(ticket);
	}

	public List<TicketDTO> listByQueueAndStatus(UUID queueId, TicketStatus status) {
		assertStaffCanAccessQueue(queueId);
		return ticketRepository.findByQueueIdAndStatusWithDetails(queueId, status).stream()
				.map(this::toDtoWithMetrics)
				.toList();
	}

	public PlaceDTO getStaffAssignedPlace() {
		User staff = currentStaffUser();
		if (staff.getRole() == UserRole.ADMIN) {
			throw new BusinessException(
					ErrorCode.VALIDATION_ERROR, "Admins do not have an assigned place", HttpStatus.BAD_REQUEST);
		}
		Place place = staff.getPlace();
		if (place == null) {
			throw new BusinessException(
					ErrorCode.RESOURCE_NOT_FOUND, "Staff user has no assigned place", HttpStatus.NOT_FOUND);
		}
		return PlaceMapper.toDto(place);
	}

	@Transactional
	public TicketDTO callNext(UUID queueId) {
		assertStaffCanAccessQueue(queueId);
		Ticket ticket = ticketRepository
				.findFirstByQueueIdAndStatusInOrderBySequenceAsc(queueId, List.of(TicketStatus.WAITING, TicketStatus.NEARLY))
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "No tickets waiting", HttpStatus.NOT_FOUND));

		User staff = currentStaffUser();
		transition(ticket, TicketStatus.CALLED);
		ticket.setCalledAt(Instant.now());
		if (staff.getRole() == UserRole.STAFF) {
			ticket.setAssignedStaff(staff);
		}
		ticketRepository.save(ticket);
		return publishChanges(ticket);
	}

	@Transactional
	public TicketDTO acceptTicket(UUID ticketId, AcceptTicketRequest request) {
		assertStaff();
		Ticket ticket = findTicket(ticketId);
		assertStaffCanAccessQueue(ticket.getQueue().getId());

		if (ticket.getStatus() != TicketStatus.WAITING && ticket.getStatus() != TicketStatus.NEARLY) {
			throw new BusinessException(
					ErrorCode.INVALID_TICKET_TRANSITION,
					"Only waiting tickets can be accepted",
					HttpStatus.BAD_REQUEST);
		}

		ServiceQueue queue = ticket.getQueue();
		Integer counterNumber = resolveCounterNumber(queue, request != null ? request.counterNumber() : null);

		User staff = currentStaffUser();
		transition(ticket, TicketStatus.CALLED);
		ticket.setCalledAt(Instant.now());
		ticket.setCounterNumber(counterNumber);
		if (staff.getRole() == UserRole.STAFF) {
			ticket.setAssignedStaff(staff);
		}
		ticketRepository.save(ticket);
		return publishChanges(ticket);
	}

	@Transactional
	public TicketDTO startService(UUID ticketId) {
		assertStaff();
		Ticket ticket = findTicket(ticketId);
		assertStaffCanAccessQueue(ticket.getQueue().getId());
		transition(ticket, TicketStatus.SERVING);
		ticket.setServiceStartedAt(Instant.now());
		ticketRepository.save(ticket);
		return publishChanges(ticket);
	}

	@Transactional
	public TicketDTO complete(UUID ticketId) {
		assertStaff();
		Ticket ticket = findTicket(ticketId);
		assertStaffCanAccessQueue(ticket.getQueue().getId());
		transition(ticket, TicketStatus.COMPLETED);
		ticket.setCompletedAt(Instant.now());
		ticketRepository.save(ticket);
		updateNearlyStatus(ticket.getQueue().getId());
		return publishChanges(ticket);
	}

	@Transactional
	public TicketDTO expire(UUID ticketId) {
		assertStaff();
		Ticket ticket = findTicket(ticketId);
		assertStaffCanAccessQueue(ticket.getQueue().getId());
		transition(ticket, TicketStatus.EXPIRED);
		ticket.setCancelledAt(Instant.now());
		ticketRepository.save(ticket);
		updateNearlyStatus(ticket.getQueue().getId());
		return publishChanges(ticket);
	}

	@Transactional
	public void updateQueueSettings(UUID queueId, UpdateQueueSettingsRequest request) {
		assertStaffCanAccessQueue(queueId);
		ServiceQueue queue = queueRepository.findByIdWithPlace(queueId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "Queue not found", HttpStatus.NOT_FOUND));

		if (request.averageServiceMinutes() != null) {
			queue.setAverageServiceMinutes(request.averageServiceMinutes());
		}
		if (request.openCounters() != null) {
			queue.setOpenCounters(request.openCounters());
		}
		queueRepository.save(queue);
		publishStats(queue.getPlace().getId());
	}

	private TicketDTO publishChanges(Ticket ticket) {
		TicketDTO dto = toDtoWithMetrics(ticket);
		realtimeEventPublisher.publishTicketUpdate(ticket.getUser().getUsername(), dto);
		publishStats(ticket.getQueue().getPlace().getId());
		fcmNotificationService.notifyTicketUpdate(ticket.getUser().getId(), dto);
		return dto;
	}

	private void publishStats(UUID placeId) {
		PlaceStatsDTO stats = placeService.getStats(placeId);
		realtimeEventPublisher.publishStats(placeId, stats);
	}

	private void updateNearlyStatus(UUID queueId) {
		List<Ticket> waiting = ticketRepository.findByQueueIdAndStatusInOrderBySequenceAsc(
				queueId, List.of(TicketStatus.WAITING, TicketStatus.NEARLY));

		for (int i = 0; i < waiting.size(); i++) {
			Ticket t = waiting.get(i);
			TicketStatus newStatus = i <= 1 ? TicketStatus.NEARLY : TicketStatus.WAITING;
			if (t.getStatus() != newStatus) {
				t.setStatus(newStatus);
				ticketRepository.save(t);
				publishChanges(t);
			}
		}
	}

	private TicketDTO toDtoWithMetrics(Ticket ticket) {
		int position = (int) ticketRepository.countActiveBefore(
				ticket.getQueue().getId(), ticket.getSequence(), TicketStatus.ACTIVE) + 1;
		int estimated = calculateEstimatedMinutes(ticket.getQueue(), position);
		return TicketMapper.toDto(ticket, position, estimated);
	}

	private int calculateEstimatedMinutes(ServiceQueue queue, int position) {
		return (int) Math.ceil(
				(double) position * queue.getAverageServiceMinutes() / Math.max(queue.getOpenCounters(), 1));
	}

	private void transition(Ticket ticket, TicketStatus target) {
		if (!isValidTransition(ticket.getStatus(), target)) {
			throw new BusinessException(
					ErrorCode.INVALID_TICKET_TRANSITION,
					"Cannot transition from " + ticket.getStatus() + " to " + target);
		}
		ticket.setStatus(target);
	}

	private boolean isValidTransition(TicketStatus from, TicketStatus to) {
		return switch (from) {
			case WAITING, NEARLY -> to == TicketStatus.CALLED || to == TicketStatus.CANCELLED || to == TicketStatus.EXPIRED;
			case CALLED -> to == TicketStatus.SERVING || to == TicketStatus.CANCELLED || to == TicketStatus.EXPIRED;
			case SERVING -> to == TicketStatus.COMPLETED || to == TicketStatus.EXPIRED;
			default -> false;
		};
	}

	private void assertCanView(Ticket ticket) {
		UserPrincipal principal = SecurityUtils.currentUser();
		boolean isOwner = ticket.getUser().getId().equals(principal.getId());
		if (isOwner) {
			return;
		}
		if (principal.getRole() == UserRole.ADMIN) {
			return;
		}
		if (principal.getRole() == UserRole.STAFF) {
			User staff = currentStaffUser();
			UUID staffPlaceId = staff.getPlace() != null ? staff.getPlace().getId() : null;
			UUID ticketPlaceId = ticket.getQueue().getPlace().getId();
			if (staffPlaceId != null && staffPlaceId.equals(ticketPlaceId)) {
				return;
			}
		}
		throw new BusinessException(ErrorCode.FORBIDDEN, "Access denied", HttpStatus.FORBIDDEN);
	}

	private void assertStaff() {
		UserPrincipal principal = SecurityUtils.currentUser();
		if (principal.getRole() != UserRole.STAFF && principal.getRole() != UserRole.ADMIN) {
			throw new BusinessException(ErrorCode.FORBIDDEN, "Staff access required", HttpStatus.FORBIDDEN);
		}
	}

	private void assertStaffCanAccessQueue(UUID queueId) {
		assertStaff();
		UserPrincipal principal = SecurityUtils.currentUser();
		if (principal.getRole() == UserRole.ADMIN) {
			return;
		}

		User staff = currentStaffUser();
		if (staff.getPlace() == null) {
			throw new BusinessException(
					ErrorCode.FORBIDDEN, "Staff user has no assigned place", HttpStatus.FORBIDDEN);
		}

		ServiceQueue queue = queueRepository.findByIdWithPlace(queueId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "Queue not found", HttpStatus.NOT_FOUND));

		if (!staff.getPlace().getId().equals(queue.getPlace().getId())) {
			throw new BusinessException(
					ErrorCode.FORBIDDEN, "Cannot access another establishment's queue", HttpStatus.FORBIDDEN);
		}
	}

	private User currentStaffUser() {
		UserPrincipal principal = SecurityUtils.currentUser();
		return userRepository.findByIdWithPlace(principal.getId())
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
	}

	private Integer resolveCounterNumber(ServiceQueue queue, Integer requested) {
		if (queue.getOpenCounters() <= 1) {
			return null;
		}
		if (requested == null) {
			throw new BusinessException(
					ErrorCode.COUNTER_NUMBER_REQUIRED,
					"Counter number is required when multiple counters are open",
					HttpStatus.BAD_REQUEST);
		}
		if (requested < 1 || requested > queue.getOpenCounters()) {
			throw new BusinessException(
					ErrorCode.VALIDATION_ERROR,
					"Counter number must be between 1 and " + queue.getOpenCounters(),
					HttpStatus.BAD_REQUEST);
		}
		return requested;
	}

	private Ticket findTicket(UUID ticketId) {
		return ticketRepository.findByIdWithDetails(ticketId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "Ticket not found", HttpStatus.NOT_FOUND));
	}

	private String formatNumber(String prefix, int sequence) {
		return prefix + "-" + String.format("%03d", sequence);
	}
}
