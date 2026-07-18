package mx.edu.uteq.virtual_queue_back.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreviewDTO {

	private String fcmToken;
	private String title;
	private String body;
	private String ticketId;
	private String placeId;
	private String placeName;
	private String placeAddress;
	private String placeCategory;
	private String ticketNumber;
	private int currentPosition;
	private int estimatedWaitMinutes;
	private String status;
	private Instant issuedAt;
	private Instant notifiedAt;
	private String androidPriority;
	private boolean vibrate;
	private String accentColor;
}
