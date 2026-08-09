package mx.edu.uteq.virtual_queue_back.place.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import mx.edu.uteq.virtual_queue_back.place.dto.CreatePlaceRequest;
import mx.edu.uteq.virtual_queue_back.place.dto.PlaceDTO;
import mx.edu.uteq.virtual_queue_back.place.dto.PlaceStatsDTO;
import mx.edu.uteq.virtual_queue_back.place.dto.PlaceStatusRequest;
import mx.edu.uteq.virtual_queue_back.place.dto.QueueDTO;
import mx.edu.uteq.virtual_queue_back.place.dto.StaffRegistrationKeyResponse;
import mx.edu.uteq.virtual_queue_back.place.dto.UpdatePlaceRequest;
import mx.edu.uteq.virtual_queue_back.place.service.PlaceService;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

	private final PlaceService placeService;

	public PlaceController(PlaceService placeService) {
		this.placeService = placeService;
	}

	@GetMapping
	public Page<PlaceDTO> search(
			@RequestParam(required = false) String query,
			@RequestParam(required = false) String category,
			Pageable pageable) {
		return placeService.search(query, category, pageable);
	}

	@GetMapping("/{placeId}")
	public PlaceDTO getById(@PathVariable UUID placeId) {
		return placeService.getById(placeId);
	}

	@GetMapping("/{placeId}/queue")
	public QueueDTO getQueue(@PathVariable UUID placeId) {
		return placeService.getQueue(placeId);
	}

	@GetMapping("/{placeId}/stats")
	public PlaceStatsDTO getStats(@PathVariable UUID placeId) {
		return placeService.getStats(placeId);
	}

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public PlaceDTO create(@Valid @RequestBody CreatePlaceRequest request) {
		return placeService.create(request);
	}

	@PutMapping("/{placeId}")
	@PreAuthorize("hasRole('ADMIN')")
	public PlaceDTO update(@PathVariable UUID placeId, @Valid @RequestBody UpdatePlaceRequest request) {
		return placeService.update(placeId, request);
	}

	@PatchMapping("/{placeId}/status")
	@PreAuthorize("hasRole('ADMIN')")
	public PlaceDTO updateStatus(@PathVariable UUID placeId, @Valid @RequestBody PlaceStatusRequest request) {
		return placeService.updateStatus(placeId, request.active());
	}

	@PostMapping("/{placeId}/staff-registration-key/rotate")
	@PreAuthorize("hasRole('ADMIN')")
	public StaffRegistrationKeyResponse rotateStaffRegistrationKey(@PathVariable UUID placeId) {
		return placeService.rotateStaffRegistrationKey(placeId);
	}
}
