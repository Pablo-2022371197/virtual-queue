package mx.edu.uteq.virtual_queue_back.ticket.dto;

public record CounterSlotDTO(
		int number,
		String code,
		boolean occupied,
		String occupiedBy,
		boolean claimedByMe) {
}
