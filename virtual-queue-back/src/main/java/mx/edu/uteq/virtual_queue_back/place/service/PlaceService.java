package mx.edu.uteq.virtual_queue_back.place.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import mx.edu.uteq.virtual_queue_back.common.BusinessException;
import mx.edu.uteq.virtual_queue_back.common.ErrorCode;
import mx.edu.uteq.virtual_queue_back.common.TicketStatus;
import mx.edu.uteq.virtual_queue_back.common.UserRole;
import mx.edu.uteq.virtual_queue_back.place.dto.CreatePlaceRequest;
import mx.edu.uteq.virtual_queue_back.place.dto.PlaceDTO;
import mx.edu.uteq.virtual_queue_back.place.dto.PlaceStatsDTO;
import mx.edu.uteq.virtual_queue_back.place.dto.QueueDTO;
import mx.edu.uteq.virtual_queue_back.place.dto.StaffRegistrationKeyResponse;
import mx.edu.uteq.virtual_queue_back.place.dto.UpdatePlaceRequest;
import mx.edu.uteq.virtual_queue_back.place.entity.Place;
import mx.edu.uteq.virtual_queue_back.place.mapper.PlaceMapper;
import mx.edu.uteq.virtual_queue_back.place.repository.PlaceRepository;
import mx.edu.uteq.virtual_queue_back.queue.entity.ServiceQueue;
import mx.edu.uteq.virtual_queue_back.queue.repository.ServiceQueueRepository;
import mx.edu.uteq.virtual_queue_back.security.SecurityUtils;
import mx.edu.uteq.virtual_queue_back.security.UserPrincipal;
import mx.edu.uteq.virtual_queue_back.ticket.entity.Ticket;
import mx.edu.uteq.virtual_queue_back.ticket.repository.TicketRepository;
import mx.edu.uteq.virtual_queue_back.user.entity.User;
import mx.edu.uteq.virtual_queue_back.user.repository.UserRepository;

@Service
public class PlaceService {

	private final PlaceRepository placeRepository;
	private final ServiceQueueRepository queueRepository;
	private final TicketRepository ticketRepository;
	private final UserRepository userRepository;
	private final StaffRegistrationKeyService staffRegistrationKeyService;

	public PlaceService(
			PlaceRepository placeRepository,
			ServiceQueueRepository queueRepository,
			TicketRepository ticketRepository,
			UserRepository userRepository,
			StaffRegistrationKeyService staffRegistrationKeyService) {
		this.placeRepository = placeRepository;
		this.queueRepository = queueRepository;
		this.ticketRepository = ticketRepository;
		this.userRepository = userRepository;
		this.staffRegistrationKeyService = staffRegistrationKeyService;
	}

	public Page<PlaceDTO> search(String query, String category, Pageable pageable) {
		return searchManaged(query, category, true, pageable);
	}

	public Page<PlaceDTO> searchManaged(String query, String category, Boolean active, Pageable pageable) {
		String normalizedQuery = query == null || query.isBlank() ? "" : query.trim();
		String normalizedCategory = category == null || category.isBlank() ? null : category.trim();
		return placeRepository.search(normalizedQuery, normalizedCategory, active, pageable).map(this::toPlaceDto);
	}

	public List<PlaceDTO> listPlacesForStats() {
		UserPrincipal principal = SecurityUtils.currentUser();
		return switch (principal.getRole()) {
			case ADMIN -> placeRepository.findAll().stream().map(this::toPlaceDto).toList();
			case STAFF -> {
				User staff = userRepository.findByIdWithPlace(principal.getId())
						.orElseThrow(() -> new BusinessException(
								ErrorCode.RESOURCE_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
				if (staff.getPlace() == null) {
					yield List.of();
				}
				yield List.of(toPlaceDto(staff.getPlace()));
			}
			case CUSTOMER -> placeRepository.findPlacesVisitedByUser(principal.getId()).stream()
					.map(this::toPlaceDto)
					.toList();
		};
	}

	public PlaceDTO getById(UUID placeId) {
		return toPlaceDto(findPlace(placeId));
	}

	public QueueDTO getQueue(UUID placeId) {
		ServiceQueue queue = queueRepository.findByPlaceId(placeId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "Queue not found", HttpStatus.NOT_FOUND));
		return toQueueDto(queue);
	}

	public PlaceStatsDTO getStats(UUID placeId) {
		assertCanViewStats(placeId);
		return buildStats(placeId);
	}

	/**
	 * Stats used by internal realtime publishing (no caller ACL).
	 */
	public PlaceStatsDTO getStatsInternal(UUID placeId) {
		return buildStats(placeId);
	}

	private PlaceStatsDTO buildStats(UUID placeId) {
		ServiceQueue queue = queueRepository.findByPlaceId(placeId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "Queue not found", HttpStatus.NOT_FOUND));

		long activeTickets = ticketRepository.countActiveInQueue(queue.getId(), TicketStatus.ACTIVE);
		String turnCalled = ticketRepository
				.findFirstByQueueIdAndStatusInOrderBySequenceAsc(queue.getId(), TicketStatus.ACTIVE)
				.map(Ticket::getNumber)
				.orElse(null);

		int avgService = resolveAverageServiceMinutes(queue);
		int staffing = staffingCounters(placeId);
		int avgWait = (int) Math.ceil((double) activeTickets * avgService / Math.max(staffing, 1));

		return new PlaceStatsDTO(placeId, (int) activeTickets, avgWait, staffing, turnCalled);
	}

	@Transactional
	public PlaceDTO create(CreatePlaceRequest request) {
		Place place = Place.builder()
				.id(UUID.randomUUID())
				.name(request.name())
				.address(request.address())
				.category(request.category())
				.description(request.description())
				.active(true)
				.build();
		placeRepository.save(place);

		int totalCounters = request.totalCounters() != null ? request.totalCounters() : 1;
		ServiceQueue queue = ServiceQueue.builder()
				.id(UUID.randomUUID())
				.place(place)
				.openCounters(Math.max(totalCounters, 1))
				.build();
		queueRepository.save(queue);

		return PlaceMapper.toDto(place, queue.getOpenCounters());
	}

	@Transactional
	public PlaceDTO update(UUID placeId, UpdatePlaceRequest request) {
		Place place = findPlace(placeId);
		place.setName(request.name());
		place.setAddress(request.address());
		place.setCategory(request.category());
		place.setDescription(request.description());
		placeRepository.save(place);

		ServiceQueue queue = queueRepository.findByPlaceId(placeId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "Queue not found", HttpStatus.NOT_FOUND));

		if (request.totalCounters() != null) {
			int total = Math.max(request.totalCounters(), 1);
			if (total < queue.getOpenCounters()) {
				userRepository.clearClaimsAbove(placeId, total);
			}
			queue.setOpenCounters(total);
			queueRepository.save(queue);
		}

		return PlaceMapper.toDto(place, queue.getOpenCounters());
	}

	@Transactional
	public PlaceDTO updateStatus(UUID placeId, boolean active) {
		Place place = findPlace(placeId);
		place.setActive(active);
		return toPlaceDto(placeRepository.save(place));
	}

	@Transactional
	public StaffRegistrationKeyResponse rotateStaffRegistrationKey(UUID placeId) {
		Place place = findPlace(placeId);
		String plainKey;
		String digest;
		int attempts = 0;
		do {
			plainKey = staffRegistrationKeyService.generatePlainKey();
			digest = staffRegistrationKeyService.digest(plainKey);
			attempts++;
			if (attempts > 20) {
				throw new BusinessException(
						ErrorCode.INTERNAL_ERROR,
						"Unable to generate unique staff registration key",
						HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
		while (placeRepository.findByStaffRegistrationKeyDigestAndActiveTrue(digest).isPresent()
				&& !digest.equals(place.getStaffRegistrationKeyDigest()));

		place.setStaffRegistrationKeyDigest(digest);
		placeRepository.save(place);

		return new StaffRegistrationKeyResponse(place.getId(), place.getName(), plainKey);
	}

	public Place findActiveByStaffRegistrationKey(String rawKey) {
		String normalized = staffRegistrationKeyService.normalize(rawKey);
		if (!staffRegistrationKeyService.isValidFormat(normalized)) {
			throw new BusinessException(
					ErrorCode.INVALID_STAFF_REGISTRATION_KEY,
					"Invalid staff registration key",
					HttpStatus.BAD_REQUEST);
		}
		String digest = staffRegistrationKeyService.digest(normalized);
		return placeRepository.findByStaffRegistrationKeyDigestAndActiveTrue(digest)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.INVALID_STAFF_REGISTRATION_KEY,
						"Invalid staff registration key",
						HttpStatus.BAD_REQUEST));
	}

	public Place findPlace(UUID placeId) {
		return placeRepository.findById(placeId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "Place not found", HttpStatus.NOT_FOUND));
	}

	public int resolveAverageServiceMinutes(ServiceQueue queue) {
		Double avg = ticketRepository.averageServiceMinutes(queue.getId());
		if (avg == null || avg.isNaN() || avg <= 0) {
			return Math.max(queue.getAverageServiceMinutes(), 1);
		}
		return Math.max((int) Math.round(avg), 1);
	}

	public int staffingCounters(UUID placeId) {
		long claimed = userRepository.countClaimedByPlaceId(placeId);
		return (int) Math.max(claimed, 1);
	}

	private PlaceDTO toPlaceDto(Place place) {
		int total = queueRepository.findByPlaceId(place.getId())
				.map(ServiceQueue::getOpenCounters)
				.orElse(1);
		return PlaceMapper.toDto(place, total);
	}

	private QueueDTO toQueueDto(ServiceQueue queue) {
		return PlaceMapper.toQueueDto(
				queue,
				resolveAverageServiceMinutes(queue),
				staffingCounters(queue.getPlace().getId()));
	}

	private void assertCanViewStats(UUID placeId) {
		UserPrincipal principal = SecurityUtils.currentUser();
		if (principal.getRole() == UserRole.ADMIN) {
			return;
		}
		if (principal.getRole() == UserRole.STAFF) {
			User staff = userRepository.findByIdWithPlace(principal.getId())
					.orElseThrow(() -> new BusinessException(
							ErrorCode.RESOURCE_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
			UUID staffPlaceId = staff.getPlace() != null ? staff.getPlace().getId() : null;
			if (staffPlaceId == null || !staffPlaceId.equals(placeId)) {
				throw new BusinessException(
						ErrorCode.FORBIDDEN,
						"Staff can only view stats for their assigned place",
						HttpStatus.FORBIDDEN);
			}
			return;
		}
		if (!ticketRepository.existsByUserIdAndPlaceId(principal.getId(), placeId)) {
			throw new BusinessException(
					ErrorCode.FORBIDDEN,
					"Stats are only available for places where you have taken a ticket",
					HttpStatus.FORBIDDEN);
		}
	}
}
