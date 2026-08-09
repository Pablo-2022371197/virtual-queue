package mx.edu.uteq.virtual_queue_back.device.dto;

import java.util.UUID;

import mx.edu.uteq.virtual_queue_back.common.DevicePlatform;

public record DeviceRegistrationDTO(
		UUID id,
		DevicePlatform platform,
		String deviceName,
		boolean active) {
}
