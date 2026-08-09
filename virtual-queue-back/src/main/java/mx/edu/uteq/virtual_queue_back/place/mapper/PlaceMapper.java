package mx.edu.uteq.virtual_queue_back.place.mapper;

import mx.edu.uteq.virtual_queue_back.place.dto.PlaceDTO;
import mx.edu.uteq.virtual_queue_back.place.dto.QueueDTO;
import mx.edu.uteq.virtual_queue_back.place.entity.Place;
import mx.edu.uteq.virtual_queue_back.queue.entity.ServiceQueue;

public final class PlaceMapper {

	private PlaceMapper() {
	}

	public static PlaceDTO toDto(Place place) {
		return new PlaceDTO(
				place.getId(),
				place.getName(),
				place.getAddress(),
				place.getCategory(),
				place.getDescription(),
				place.isActive(),
				place.getCreatedAt());
	}

	public static QueueDTO toQueueDto(ServiceQueue queue) {
		return new QueueDTO(
				queue.getId(),
				queue.getPlace().getId(),
				queue.getPrefix(),
				queue.getAverageServiceMinutes(),
				queue.getOpenCounters(),
				queue.isActive());
	}
}
