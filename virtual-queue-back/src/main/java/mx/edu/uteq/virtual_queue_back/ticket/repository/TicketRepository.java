package mx.edu.uteq.virtual_queue_back.ticket.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import mx.edu.uteq.virtual_queue_back.common.TicketStatus;
import mx.edu.uteq.virtual_queue_back.ticket.entity.Ticket;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

	@Query("""
			SELECT t FROM Ticket t
			JOIN FETCH t.queue q
			JOIN FETCH q.place
			JOIN FETCH t.user
			WHERE t.user.id = :userId AND t.status IN :activeStatuses
			""")
	Optional<Ticket> findActiveByUserId(
			@Param("userId") UUID userId,
			@Param("activeStatuses") Collection<TicketStatus> activeStatuses);

	List<Ticket> findByQueueIdAndStatusInOrderBySequenceAsc(UUID queueId, Collection<TicketStatus> statuses);

	@Query("""
			SELECT t FROM Ticket t
			JOIN FETCH t.queue q
			JOIN FETCH q.place
			WHERE t.queue.id = :queueId AND t.status = :status
			ORDER BY t.sequence ASC
			""")
	List<Ticket> findByQueueIdAndStatusWithDetails(
			@Param("queueId") UUID queueId,
			@Param("status") TicketStatus status);

	@Query("""
			SELECT COUNT(t) FROM Ticket t
			WHERE t.queue.id = :queueId
			  AND t.status IN :activeStatuses
			  AND t.sequence < :sequence
			""")
	long countActiveBefore(
			@Param("queueId") UUID queueId,
			@Param("sequence") int sequence,
			@Param("activeStatuses") Collection<TicketStatus> activeStatuses);

	@Query("""
			SELECT COUNT(t) FROM Ticket t
			WHERE t.queue.id = :queueId AND t.status IN :activeStatuses
			""")
	long countActiveInQueue(
			@Param("queueId") UUID queueId,
			@Param("activeStatuses") Collection<TicketStatus> activeStatuses);

	boolean existsByQueueIdAndUserIdAndStatusIn(UUID queueId, UUID userId, Collection<TicketStatus> statuses);

	@Query("""
			SELECT t FROM Ticket t
			JOIN FETCH t.queue q
			JOIN FETCH q.place
			JOIN FETCH t.user
			WHERE t.id = :id
			""")
	Optional<Ticket> findByIdWithDetails(@Param("id") UUID id);

	Optional<Ticket> findFirstByQueueIdAndStatusInOrderBySequenceAsc(UUID queueId, Collection<TicketStatus> statuses);
}
