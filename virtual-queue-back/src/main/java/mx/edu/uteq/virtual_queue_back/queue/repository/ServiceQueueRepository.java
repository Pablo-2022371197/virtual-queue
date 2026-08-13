package mx.edu.uteq.virtual_queue_back.queue.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import mx.edu.uteq.virtual_queue_back.queue.entity.ServiceQueue;

public interface ServiceQueueRepository extends JpaRepository<ServiceQueue, UUID> {

	Optional<ServiceQueue> findByPlaceId(UUID placeId);

	@Query("SELECT q FROM ServiceQueue q JOIN FETCH q.place WHERE q.place.id = :placeId")
	Optional<ServiceQueue> findByPlaceIdWithPlace(@Param("placeId") UUID placeId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT q FROM ServiceQueue q WHERE q.id = :id")
	Optional<ServiceQueue> findByIdForUpdate(@Param("id") UUID id);

	@Query("SELECT q FROM ServiceQueue q JOIN FETCH q.place WHERE q.id = :id")
	Optional<ServiceQueue> findByIdWithPlace(@Param("id") UUID id);
}
