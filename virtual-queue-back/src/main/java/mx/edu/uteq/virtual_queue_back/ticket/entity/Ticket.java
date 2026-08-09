package mx.edu.uteq.virtual_queue_back.ticket.entity;

import java.time.Instant;
import java.util.UUID;

import mx.edu.uteq.virtual_queue_back.common.TicketStatus;
import mx.edu.uteq.virtual_queue_back.queue.entity.ServiceQueue;
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
@Table(name = "tickets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

	@Id
	@Column(nullable = false, updatable = false)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "queue_id", nullable = false)
	private ServiceQueue queue;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(nullable = false)
	private String number;

	@Column(nullable = false)
	private int sequence;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TicketStatus status;

	@Column(name = "issued_at", nullable = false)
	private Instant issuedAt;

	@Column(name = "called_at")
	private Instant calledAt;

	@Column(name = "service_started_at")
	private Instant serviceStartedAt;

	@Column(name = "completed_at")
	private Instant completedAt;

	@Column(name = "cancelled_at")
	private Instant cancelledAt;

	@Column(name = "counter_number")
	private Integer counterNumber;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assigned_staff_id")
	private User assignedStaff;
}
