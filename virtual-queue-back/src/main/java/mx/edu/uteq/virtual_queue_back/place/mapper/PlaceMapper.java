package mx.edu.uteq.virtual_queue_back.place.mapper;

import mx.edu.uteq.virtual_queue_back.common.CounterLabelMode;
import mx.edu.uteq.virtual_queue_back.place.dto.PlaceDTO;
import mx.edu.uteq.virtual_queue_back.place.dto.QueueDTO;
import mx.edu.uteq.virtual_queue_back.place.entity.Place;
import mx.edu.uteq.virtual_queue_back.queue.entity.ServiceQueue;

public final class PlaceMapper {

	private PlaceMapper() {
	}

	public static PlaceDTO toDto(Place place) {
		return toDto(place, 1);
	}

	public static PlaceDTO toDto(Place place, int totalCounters) {
		CounterLabelMode mode = place.getCounterLabelMode() != null
				? place.getCounterLabelMode()
				: CounterLabelMode.LETTERS;
		return new PlaceDTO(
				place.getId(),
				place.getName(),
				place.getAddress(),
				place.getCategory(),
				place.getDescription(),
				place.isActive(),
				place.getCreatedAt(),
				Math.max(totalCounters, 1),
				mode);
	}

	public static QueueDTO toQueueDto(ServiceQueue queue, int averageServiceMinutes, int staffingCounters) {
		int total = Math.max(queue.getOpenCounters(), 1);
		Place place = queue.getPlace();
		CounterLabelMode mode = place != null && place.getCounterLabelMode() != null
				? place.getCounterLabelMode()
				: CounterLabelMode.LETTERS;
		return new QueueDTO(
				queue.getId(),
				place.getId(),
				queue.getPrefix(),
				averageServiceMinutes,
				Math.max(staffingCounters, 1),
				total,
				queue.isActive(),
				mode);
	}
}
