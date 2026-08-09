package mx.edu.uteq.virtual_queue_back.device.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import mx.edu.uteq.virtual_queue_back.device.dto.DeviceRegistrationDTO;
import mx.edu.uteq.virtual_queue_back.device.dto.RegisterDeviceRequest;
import mx.edu.uteq.virtual_queue_back.device.service.DeviceService;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

	private final DeviceService deviceService;

	public DeviceController(DeviceService deviceService) {
		this.deviceService = deviceService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public DeviceRegistrationDTO register(@Valid @RequestBody RegisterDeviceRequest request) {
		return deviceService.register(request);
	}

	@DeleteMapping("/{registrationId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void unregister(@PathVariable UUID registrationId) {
		deviceService.unregister(registrationId);
	}
}
