package mx.edu.uteq.virtual_queue_back.place.entity;

import java.util.UUID;

import mx.edu.uteq.virtual_queue_back.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "places")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Place extends AuditableEntity {

	@Id
	@Column(nullable = false, updatable = false)
	private UUID id;

	@Column(nullable = false)
	private String name;

	private String address;

	private String category;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Column(nullable = false)
	private boolean active;

	/** HMAC-SHA256 hex digest of the staff registration key. Never store plaintext. */
	@Column(name = "staff_registration_key_digest", length = 64)
	private String staffRegistrationKeyDigest;
}
