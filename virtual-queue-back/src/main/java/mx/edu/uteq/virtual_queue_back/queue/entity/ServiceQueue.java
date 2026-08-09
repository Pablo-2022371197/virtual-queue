package mx.edu.uteq.virtual_queue_back.queue.entity;

import java.util.UUID;

import mx.edu.uteq.virtual_queue_back.place.entity.Place;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "service_queues")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceQueue {

	@Id
	@Column(nullable = false, updatable = false)
	private UUID id;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "place_id", nullable = false, unique = true)
	private Place place;

	@Column(nullable = false)
	@Builder.Default
	private String prefix = "A";

	@Column(name = "last_sequence", nullable = false)
	@Builder.Default
	private int lastSequence = 0;

	@Column(name = "average_service_minutes", nullable = false)
	@Builder.Default
	private int averageServiceMinutes = 10;

	@Column(name = "open_counters", nullable = false)
	@Builder.Default
	private int openCounters = 1;

	@Column(nullable = false)
	@Builder.Default
	private boolean active = true;

	@Version
	@Column(nullable = false)
	private long version;
}
