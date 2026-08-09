package mx.edu.uteq.virtual_queue_back.user.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import mx.edu.uteq.virtual_queue_back.auth.dto.UserSummaryDTO;
import mx.edu.uteq.virtual_queue_back.common.BusinessException;
import mx.edu.uteq.virtual_queue_back.common.ErrorCode;
import mx.edu.uteq.virtual_queue_back.common.UserRole;
import mx.edu.uteq.virtual_queue_back.place.entity.Place;
import mx.edu.uteq.virtual_queue_back.place.service.PlaceService;
import mx.edu.uteq.virtual_queue_back.user.dto.AssignStaffPlaceRequest;
import mx.edu.uteq.virtual_queue_back.user.entity.User;
import mx.edu.uteq.virtual_queue_back.user.repository.UserRepository;

@Service
public class UserAdminService {

	private final UserRepository userRepository;
	private final PlaceService placeService;

	public UserAdminService(UserRepository userRepository, PlaceService placeService) {
		this.userRepository = userRepository;
		this.placeService = placeService;
	}

	@Transactional
	public UserSummaryDTO assignStaffPlace(UUID userId, AssignStaffPlaceRequest request) {
		User user = userRepository.findByIdWithPlace(userId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));

		if (user.getRole() != UserRole.STAFF) {
			throw new BusinessException(
					ErrorCode.VALIDATION_ERROR, "Only STAFF users can be assigned to a place", HttpStatus.BAD_REQUEST);
		}

		Place place = placeService.findPlace(request.placeId());
		user.setPlace(place);
		userRepository.save(user);
		return toSummary(user);
	}

	private UserSummaryDTO toSummary(User user) {
		Place place = user.getPlace();
		return new UserSummaryDTO(
				user.getId(),
				user.getUsername(),
				user.getFullName(),
				user.getRole(),
				place != null ? place.getId() : null,
				place != null ? place.getName() : null);
	}
}
