package mx.edu.uteq.virtual_queue_back.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import mx.edu.uteq.virtual_queue_back.auth.dto.AuthResponseDTO;
import mx.edu.uteq.virtual_queue_back.auth.dto.ChangePasswordRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.LoginRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.LogoutRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.RefreshRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.RegisterRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.UpdateProfileRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.UserSummaryDTO;
import mx.edu.uteq.virtual_queue_back.auth.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponseDTO register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	public AuthResponseDTO login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@PostMapping("/refresh")
	public AuthResponseDTO refresh(@Valid @RequestBody RefreshRequest request) {
		return authService.refresh(request);
	}

	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logout(@Valid @RequestBody LogoutRequest request) {
		authService.logout(request);
	}

	@GetMapping("/me")
	public UserSummaryDTO me() {
		return authService.me();
	}

	@PatchMapping("/me")
	public UserSummaryDTO updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
		return authService.updateProfile(request);
	}

	@PutMapping("/password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
		authService.changePassword(request);
	}
}
