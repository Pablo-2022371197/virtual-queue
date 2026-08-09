package mx.edu.uteq.virtual_queue_back.place.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import mx.edu.uteq.virtual_queue_back.common.BusinessException;
import mx.edu.uteq.virtual_queue_back.common.ErrorCode;
import mx.edu.uteq.virtual_queue_back.common.TicketStatus;
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
import mx.edu.uteq.virtual_queue_back.ticket.entity.Ticket;
import mx.edu.uteq.virtual_queue_back.ticket.repository.TicketRepository;

@Service
public class PlaceService {

	private final PlaceRepository placeRepository;
	private final ServiceQueueRepository queueRepository;
	private final TicketRepository ticketRepository;
	private final StaffRegistrationKeyService staffRegistrationKeyService;

	public PlaceService(
			PlaceRepository placeRepository,
			ServiceQueueRepository queueRepository,
			TicketRepository ticketRepository,
			StaffRegistrationKeyService staffRegistrationKeyService) {
		this.placeRepository = placeRepository;
		this.queueRepository = queueRepository;
		this.ticketRepository = ticketRepository;
		this.staffRegistrationKeyService = staffRegistrationKeyService;
	}

	public Page<PlaceDTO> search(String query, String category, Pageable pageable) {
		String normalizedQuery = query == null || query.isBlank() ? "" : query.trim();
		String normalizedCategory = category == null || category.isBlank() ? null : category.trim();
		return placeRepository.search(normalizedQuery, normalizedCategory, true, pageable).map(PlaceMapper::toDto);
	}

	public PlaceDTO getById(UUID placeId) {
		return PlaceMapper.toDto(findPlace(placeId));
	}

	public QueueDTO getQueue(UUID placeId) {
		ServiceQueue queue = queueRepository.findByPlaceId(placeId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "Queue not found", HttpStatus.NOT_FOUND));
		return PlaceMapper.toQueueDto(queue);
	}

	public PlaceStatsDTO getStats(UUID placeId) {
		ServiceQueue queue = queueRepository.findByPlaceId(placeId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "Queue not found", HttpStatus.NOT_FOUND));

		long activeTickets = ticketRepository.countActiveInQueue(queue.getId(), TicketStatus.ACTIVE);
		String turnCalled = ticketRepository
				.findFirstByQueueIdAndStatusInOrderBySequenceAsc(queue.getId(), TicketStatus.ACTIVE)
				.map(Ticket::getNumber)
				.orElse(null);

		int avgWait = (int) Math.ceil(
				(double) activeTickets * queue.getAverageServiceMinutes() / Math.max(queue.getOpenCounters(), 1));

		return new PlaceStatsDTO(placeId, (int) activeTickets, avgWait, queue.getOpenCounters(), turnCalled);
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

		ServiceQueue queue = ServiceQueue.builder()
				.id(UUID.randomUUID())
				.place(place)
				.build();
		queueRepository.save(queue);

		return PlaceMapper.toDto(place);
	}

	@Transactional
	public PlaceDTO update(UUID placeId, UpdatePlaceRequest request) {
		Place place = findPlace(placeId);
		place.setName(request.name());
		place.setAddress(request.address());
		place.setCategory(request.category());
		place.setDescription(request.description());
		return PlaceMapper.toDto(placeRepository.save(place));
	}

	@Transactional
	public PlaceDTO updateStatus(UUID placeId, boolean active) {
		Place place = findPlace(placeId);
		place.setActive(active);
		return PlaceMapper.toDto(placeRepository.save(place));
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
}
