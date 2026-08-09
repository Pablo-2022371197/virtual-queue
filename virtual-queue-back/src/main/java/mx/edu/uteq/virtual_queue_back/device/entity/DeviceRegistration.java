package mx.edu.uteq.virtual_queue_back.device.entity;

import java.time.Instant;
import java.util.UUID;

import mx.edu.uteq.virtual_queue_back.common.DevicePlatform;
import mx.edu.uteq.virtual_queue_back.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "device_registrations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceRegistration {

	@Id
	@Column(nullable = false, updatable = false)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "fcm_token", nullable = false, unique = true)
	private String fcmToken;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private DevicePlatform platform;

	@Column(name = "device_name")
	private String deviceName;

	@Column(nullable = false)
	@Builder.Default
	private boolean active = true;

	@Column(name = "last_seen_at", nullable = false)
	private Instant lastSeenAt;
}
