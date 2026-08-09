package mx.edu.uteq.virtual_queue_back.user.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import mx.edu.uteq.virtual_queue_back.auth.dto.UserSummaryDTO;
import mx.edu.uteq.virtual_queue_back.user.dto.AssignStaffPlaceRequest;
import mx.edu.uteq.virtual_queue_back.user.service.UserAdminService;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

	private final UserAdminService userAdminService;

	public AdminUserController(UserAdminService userAdminService) {
		this.userAdminService = userAdminService;
	}

	@PatchMapping("/{userId}/place")
	public UserSummaryDTO assignPlace(
			@PathVariable UUID userId,
			@Valid @RequestBody AssignStaffPlaceRequest request) {
		return userAdminService.assignStaffPlace(userId, request);
	}
}
