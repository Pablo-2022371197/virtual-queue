package mx.edu.uteq.virtual_queue_back.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import mx.edu.uteq.virtual_queue_back.auth.dto.AuthResponseDTO;
import mx.edu.uteq.virtual_queue_back.auth.dto.ChangePasswordRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.LoginRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.LogoutRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.RefreshRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.RegisterRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.UpdateProfileRequest;
import mx.edu.uteq.virtual_queue_back.auth.dto.UserSummaryDTO;
import mx.edu.uteq.virtual_queue_back.auth.entity.RefreshToken;
import mx.edu.uteq.virtual_queue_back.auth.repository.RefreshTokenRepository;
import mx.edu.uteq.virtual_queue_back.common.BusinessException;
import mx.edu.uteq.virtual_queue_back.common.ErrorCode;
import mx.edu.uteq.virtual_queue_back.common.UserRole;
import mx.edu.uteq.virtual_queue_back.place.entity.Place;
import mx.edu.uteq.virtual_queue_back.place.service.PlaceService;
import mx.edu.uteq.virtual_queue_back.security.JwtProperties;
import mx.edu.uteq.virtual_queue_back.security.JwtService;
import mx.edu.uteq.virtual_queue_back.security.SecurityUtils;
import mx.edu.uteq.virtual_queue_back.security.UserPrincipal;
import mx.edu.uteq.virtual_queue_back.user.entity.User;
import mx.edu.uteq.virtual_queue_back.user.repository.UserRepository;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final JwtProperties jwtProperties;
	private final AuthenticationManager authenticationManager;
	private final PlaceService placeService;
	private final SecureRandom secureRandom = new SecureRandom();

	public AuthService(
			UserRepository userRepository,
			RefreshTokenRepository refreshTokenRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			JwtProperties jwtProperties,
			AuthenticationManager authenticationManager,
			PlaceService placeService) {
		this.userRepository = userRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.jwtProperties = jwtProperties;
		this.authenticationManager = authenticationManager;
		this.placeService = placeService;
	}

	@Transactional
	public AuthResponseDTO register(RegisterRequest request) {
		if (userRepository.existsByEmail(request.email())) {
			throw new BusinessException(ErrorCode.DUPLICATE_EMAIL, "Email already registered", HttpStatus.CONFLICT);
		}
		if (userRepository.existsByUsername(request.username())) {
			throw new BusinessException(ErrorCode.DUPLICATE_USERNAME, "Username already taken", HttpStatus.CONFLICT);
		}

		UserRole role = request.role() == null ? UserRole.CUSTOMER : request.role();
		if (role != UserRole.CUSTOMER && role != UserRole.STAFF) {
			throw new BusinessException(
					ErrorCode.VALIDATION_ERROR, "Only CUSTOMER or STAFF can self-register", HttpStatus.BAD_REQUEST);
		}

		Place place = null;
		if (role == UserRole.STAFF) {
			if (request.staffRegistrationKey() == null || request.staffRegistrationKey().isBlank()) {
				throw new BusinessException(
						ErrorCode.STAFF_REGISTRATION_KEY_REQUIRED,
						"Staff registration key is required",
						HttpStatus.BAD_REQUEST);
			}
			place = placeService.findActiveByStaffRegistrationKey(request.staffRegistrationKey());
		}

		User user = User.builder()
				.id(UUID.randomUUID())
				.fullName(request.fullName())
				.email(request.email())
				.username(request.username())
				.passwordHash(passwordEncoder.encode(request.password()))
				.role(role)
				.place(place)
				.enabled(true)
				.build();

		userRepository.save(user);
		return issueTokens(user);
	}

	@Transactional
	public AuthResponseDTO login(LoginRequest request) {
		String identifier = request.username().trim();
		User user = userRepository.findByUsername(identifier)
				.or(() -> userRepository.findByEmailIgnoreCase(identifier))
				.orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

		try {
			authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(user.getUsername(), request.password()));
		}
		catch (BadCredentialsException ex) {
			throw new BadCredentialsException("Invalid credentials");
		}

		if (!user.isEnabled()) {
			throw new BusinessException(ErrorCode.UNAUTHORIZED, "User disabled", HttpStatus.UNAUTHORIZED);
		}

		return issueTokens(user);
	}

	@Transactional
	public AuthResponseDTO refresh(RefreshRequest request) {
		String hash = hashToken(request.refreshToken());
		RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.REFRESH_TOKEN_INVALID, "Invalid refresh token", HttpStatus.UNAUTHORIZED));

		if (stored.isRevoked()) {
			revokeFamily(stored.getFamilyId());
			throw new BusinessException(
					ErrorCode.REFRESH_TOKEN_REUSED, "Refresh token reused", HttpStatus.UNAUTHORIZED);
		}

		if (stored.isExpired()) {
			throw new BusinessException(
					ErrorCode.REFRESH_TOKEN_INVALID, "Refresh token expired", HttpStatus.UNAUTHORIZED);
		}

		stored.setRevokedAt(Instant.now());
		refreshTokenRepository.save(stored);

		return issueTokens(stored.getUser(), stored.getFamilyId());
	}

	@Transactional
	public void logout(LogoutRequest request) {
		String hash = hashToken(request.refreshToken());
		refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
			token.setRevokedAt(Instant.now());
			refreshTokenRepository.save(token);
			User user = token.getUser();
			if (user != null && user.getClaimedCounter() != null) {
				user.setClaimedCounter(null);
				userRepository.save(user);
			}
		});
	}

	public UserSummaryDTO me() {
		UserPrincipal principal = SecurityUtils.currentUser();
		User user = userRepository.findByIdWithPlace(principal.getId())
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
		return toSummary(user);
	}

	@Transactional
	public UserSummaryDTO updateProfile(UpdateProfileRequest request) {
		UserPrincipal principal = SecurityUtils.currentUser();
		User user = userRepository.findByIdWithPlace(principal.getId())
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));

		String username = request.username().trim();
		if (!username.equals(user.getUsername()) && userRepository.existsByUsername(username)) {
			throw new BusinessException(ErrorCode.DUPLICATE_USERNAME, "Username already taken", HttpStatus.CONFLICT);
		}

		user.setFullName(request.fullName().trim());
		user.setUsername(username);
		userRepository.save(user);
		return toSummary(user);
	}

	@Transactional
	public void changePassword(ChangePasswordRequest request) {
		UserPrincipal principal = SecurityUtils.currentUser();
		User user = userRepository.findById(principal.getId())
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));

		if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
			throw new BusinessException(ErrorCode.UNAUTHORIZED, "Current password is incorrect", HttpStatus.UNAUTHORIZED);
		}

		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
		userRepository.save(user);
	}

	private AuthResponseDTO issueTokens(User user) {
		return issueTokens(user, UUID.randomUUID());
	}

	private AuthResponseDTO issueTokens(User user, UUID familyId) {
		String accessToken = jwtService.generateAccessToken(user);
		String refreshToken = generateOpaqueToken();
		saveRefreshToken(user, refreshToken, familyId);

		return new AuthResponseDTO(
				accessToken,
				refreshToken,
				"Bearer",
				jwtService.accessTtlSeconds(),
				toSummary(user));
	}

	private void saveRefreshToken(User user, String rawToken, UUID familyId) {
		RefreshToken token = RefreshToken.builder()
				.id(UUID.randomUUID())
				.user(user)
				.tokenHash(hashToken(rawToken))
				.familyId(familyId)
				.expiresAt(Instant.now().plusSeconds(jwtProperties.refreshTtl()))
				.createdAt(Instant.now())
				.build();
		refreshTokenRepository.save(token);
	}

	private String generateOpaqueToken() {
		byte[] bytes = new byte[32];
		secureRandom.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private String hashToken(String raw) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 not available", ex);
		}
	}

	private UserSummaryDTO toSummary(User user) {
		Place place = user.getPlace();
		return new UserSummaryDTO(
				user.getId(),
				user.getUsername(),
				user.getFullName(),
				user.getRole(),
				place != null ? place.getId() : null,
				place != null ? place.getName() : null,
				user.getClaimedCounter(),
				mx.edu.uteq.virtual_queue_back.common.CounterLabels.toLabel(user.getClaimedCounter()));
	}

	private void revokeFamily(UUID familyId) {
		Instant now = Instant.now();
		refreshTokenRepository.findByFamilyIdAndRevokedAtIsNull(familyId)
				.forEach(token -> {
					token.setRevokedAt(now);
					refreshTokenRepository.save(token);
				});
	}
}
