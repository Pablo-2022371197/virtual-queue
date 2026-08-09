package mx.edu.uteq.virtual_queue_back.ticket.dto;

public record UpdateQueueSettingsRequest(
		Integer averageServiceMinutes,
		Integer openCounters) {
}
