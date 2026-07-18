package mx.edu.uteq.virtual_queue_back.controller;

import java.time.Instant;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import mx.edu.uteq.virtual_queue_back.dto.NotificationPreviewDTO;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

	@GetMapping("/preview")
	public ResponseEntity<NotificationPreviewDTO> preview() {
		NotificationPreviewDTO preview = NotificationPreviewDTO.builder()
				.fcmToken("dGhpcyBpcyBhIGZha2UgdG9rZW4...")
				.title("¡Ya casi es tu turno!")
				.body("Faltan 2 personas antes que tú en BBVA Bancomer")
				.ticketId("tk-20260520-a047")
				.placeId("place-bbva-qro-centro")
				.placeName("BBVA Bancomer Querétaro Centro")
				.placeAddress("Av. Constituyentes 1, Centro, Querétaro, Qro.")
				.placeCategory("Banco")
				.ticketNumber("A-047")
				.currentPosition(2)
				.estimatedWaitMinutes(8)
				.status("NEARLY")
				.issuedAt(Instant.parse("2026-05-20T19:30:00Z"))
				.notifiedAt(Instant.now())
				.androidPriority("HIGH")
				.vibrate(true)
				.accentColor("#1A73E9")
				.build();

		return ResponseEntity.ok(preview);
	}
}
