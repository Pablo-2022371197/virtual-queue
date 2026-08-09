package mx.edu.uteq.virtual_queue_back.realtime;

import java.util.List;
import java.util.UUID;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import mx.edu.uteq.virtual_queue_back.place.dto.PlaceStatsDTO;
import mx.edu.uteq.virtual_queue_back.realtime.dto.TicketEventDTO;
import mx.edu.uteq.virtual_queue_back.ticket.dto.TicketDTO;

@Service
public class RealtimeEventPublisher {

	private final SimpMessagingTemplate messagingTemplate;

	public RealtimeEventPublisher(SimpMessagingTemplate messagingTemplate) {
		this.messagingTemplate = messagingTemplate;
	}

	public void publishTicketUpdate(String username, TicketDTO ticket) {
		messagingTemplate.convertAndSendToUser(username, "/queue/ticket", TicketEventDTO.ticketUpdated(ticket));
	}

	public void publishStats(UUID placeId, PlaceStatsDTO stats) {
		messagingTemplate.convertAndSend("/topic/stats/" + placeId, stats);
	}

	public void publishStaffQueue(UUID queueId, List<TicketDTO> tickets) {
		messagingTemplate.convertAndSend("/topic/staff/queue/" + queueId, tickets);
	}
}
