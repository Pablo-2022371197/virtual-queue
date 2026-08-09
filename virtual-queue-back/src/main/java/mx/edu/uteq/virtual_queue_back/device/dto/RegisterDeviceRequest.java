package mx.edu.uteq.virtual_queue_back.device.dto;

import mx.edu.uteq.virtual_queue_back.common.DevicePlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegisterDeviceRequest(
		@NotBlank String fcmToken,
		@NotNull DevicePlatform platform,
		String deviceName) {
}
