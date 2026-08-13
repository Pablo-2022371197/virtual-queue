package mx.edu.uteq.virtual_queue_back.place.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import mx.edu.uteq.virtual_queue_back.common.CounterLabelMode;

public record UpdatePlaceRequest(
		@NotBlank String name,
		String address,
		String category,
		String description,
		@Min(1) Integer totalCounters,
		CounterLabelMode counterLabelMode) {
}
