package mx.edu.uteq.virtual_queue_back.user.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record AssignStaffPlaceRequest(
		@NotNull UUID placeId) {
}
