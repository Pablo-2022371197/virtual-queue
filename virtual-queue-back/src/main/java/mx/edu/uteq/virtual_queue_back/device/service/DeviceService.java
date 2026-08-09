package mx.edu.uteq.virtual_queue_back.device.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import mx.edu.uteq.virtual_queue_back.common.BusinessException;
import mx.edu.uteq.virtual_queue_back.common.ErrorCode;
import mx.edu.uteq.virtual_queue_back.device.dto.DeviceRegistrationDTO;
import mx.edu.uteq.virtual_queue_back.device.dto.RegisterDeviceRequest;
import mx.edu.uteq.virtual_queue_back.device.entity.DeviceRegistration;
import mx.edu.uteq.virtual_queue_back.device.repository.DeviceRegistrationRepository;
import mx.edu.uteq.virtual_queue_back.security.SecurityUtils;
import mx.edu.uteq.virtual_queue_back.user.entity.User;
import mx.edu.uteq.virtual_queue_back.user.repository.UserRepository;

@Service
public class DeviceService {

	private final DeviceRegistrationRepository deviceRepository;
	private final UserRepository userRepository;

	public DeviceService(DeviceRegistrationRepository deviceRepository, UserRepository userRepository) {
		this.deviceRepository = deviceRepository;
		this.userRepository = userRepository;
	}

	@Transactional
	public DeviceRegistrationDTO register(RegisterDeviceRequest request) {
		User user = userRepository.findById(SecurityUtils.currentUserId())
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));

		DeviceRegistration device = deviceRepository.findByFcmToken(request.fcmToken())
				.map(existing -> {
					existing.setUser(user);
					existing.setPlatform(request.platform());
					existing.setDeviceName(request.deviceName());
					existing.setActive(true);
					existing.setLastSeenAt(Instant.now());
					return existing;
				})
				.orElseGet(() -> DeviceRegistration.builder()
						.id(UUID.randomUUID())
						.user(user)
						.fcmToken(request.fcmToken())
						.platform(request.platform())
						.deviceName(request.deviceName())
						.active(true)
						.lastSeenAt(Instant.now())
						.build());

		deviceRepository.save(device);
		return toDto(device);
	}

	@Transactional
	public void unregister(UUID registrationId) {
		DeviceRegistration device = deviceRepository.findById(registrationId)
				.orElseThrow(() -> new BusinessException(
						ErrorCode.RESOURCE_NOT_FOUND, "Device not found", HttpStatus.NOT_FOUND));

		if (!device.getUser().getId().equals(SecurityUtils.currentUserId())) {
			throw new BusinessException(ErrorCode.FORBIDDEN, "Access denied", HttpStatus.FORBIDDEN);
		}

		device.setActive(false);
		deviceRepository.save(device);
	}

	private DeviceRegistrationDTO toDto(DeviceRegistration device) {
		return new DeviceRegistrationDTO(
				device.getId(), device.getPlatform(), device.getDeviceName(), device.isActive());
	}
}
