package mx.edu.uteq.virtual_queue_back.place.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UpdatePlaceRequest(
		@NotBlank String name,
		String address,
		String category,
		String description,
		@Min(1) Integer totalCounters) {
}
