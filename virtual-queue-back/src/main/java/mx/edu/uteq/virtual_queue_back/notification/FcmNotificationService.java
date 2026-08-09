package mx.edu.uteq.virtual_queue_back.notification;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;

import mx.edu.uteq.virtual_queue_back.common.TicketStatus;
import mx.edu.uteq.virtual_queue_back.device.entity.DeviceRegistration;
import mx.edu.uteq.virtual_queue_back.device.repository.DeviceRegistrationRepository;
import mx.edu.uteq.virtual_queue_back.ticket.dto.TicketDTO;

@Service
public class FcmNotificationService {

	private static final Logger log = LoggerFactory.getLogger(FcmNotificationService.class);

	private final DeviceRegistrationRepository deviceRepository;

	public FcmNotificationService(DeviceRegistrationRepository deviceRepository) {
		this.deviceRepository = deviceRepository;
	}

	private String notificationBody(TicketDTO ticket) {
		String base = "Turno " + ticket.number() + " en " + ticket.placeName();
		if (ticket.counterNumber() != null
				&& (ticket.status() == TicketStatus.CALLED || ticket.status() == TicketStatus.SERVING)) {
			return base + " — Ventanilla " + ticket.counterNumber();
		}
		return base;
	}

	public void notifyTicketUpdate(UUID userId, TicketDTO ticket) {
		if (!isFirebaseEnabled() || !shouldNotify(ticket.status())) {
			return;
		}

		List<DeviceRegistration> devices = deviceRepository.findByUserIdAndActiveTrue(userId);
		for (DeviceRegistration device : devices) {
			try {
				Message message = Message.builder()
						.setToken(device.getFcmToken())
						.setNotification(Notification.builder()
								.setTitle(notificationTitle(ticket.status()))
								.setBody(notificationBody(ticket))
								.build())
						.putAllData(buildDataPayload(ticket))
						.build();
				FirebaseMessaging.getInstance().send(message);
			}
			catch (FirebaseMessagingException ex) {
				log.warn("FCM delivery failed for device {}: {}", device.getId(), ex.getMessage());
				if (isInvalidToken(ex)) {
					device.setActive(false);
					deviceRepository.save(device);
				}
			}
			catch (Exception ex) {
				log.warn("FCM delivery failed: {}", ex.getMessage());
			}
		}
	}

	private Map<String, String> buildDataPayload(TicketDTO ticket) {
		var data = new java.util.HashMap<String, String>();
		data.put("ticketId", ticket.id().toString());
		data.put("placeId", ticket.placeId().toString());
		data.put("number", ticket.number());
		data.put("status", ticket.status().name());
		data.put("position", String.valueOf(ticket.position()));
		if (ticket.counterNumber() != null) {
			data.put("counterNumber", String.valueOf(ticket.counterNumber()));
		}
		return data;
	}

	private boolean shouldNotify(TicketStatus status) {
		return status == TicketStatus.NEARLY
				|| status == TicketStatus.CALLED
				|| status == TicketStatus.CANCELLED
				|| status == TicketStatus.EXPIRED;
	}

	private String notificationTitle(TicketStatus status) {
		return switch (status) {
			case NEARLY -> "¡Ya casi es tu turno!";
			case CALLED -> "¡Es tu turno!";
			case CANCELLED -> "Turno cancelado";
			case EXPIRED -> "Turno expirado";
			default -> "Actualización de turno";
		};
	}

	private boolean isInvalidToken(FirebaseMessagingException ex) {
		return ex.getMessagingErrorCode() != null
				&& ex.getMessagingErrorCode().name().contains("UNREGISTERED");
	}

	private boolean isFirebaseEnabled() {
		return !FirebaseApp.getApps().isEmpty();
	}
}
