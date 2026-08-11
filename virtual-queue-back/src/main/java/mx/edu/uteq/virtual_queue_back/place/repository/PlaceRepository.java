package mx.edu.uteq.virtual_queue_back.place.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import mx.edu.uteq.virtual_queue_back.place.entity.Place;

public interface PlaceRepository extends JpaRepository<Place, UUID> {

	@Query("""
			SELECT p FROM Place p
			WHERE (:active IS NULL OR p.active = :active)
			  AND (:category IS NULL OR p.category = :category)
			  AND (:query = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
			       OR LOWER(COALESCE(p.address, '')) LIKE LOWER(CONCAT('%', :query, '%')))
			""")
	Page<Place> search(
			@Param("query") String query,
			@Param("category") String category,
			@Param("active") Boolean active,
			Pageable pageable);

	@Query("""
			SELECT DISTINCT q.place FROM Ticket t
			JOIN t.queue q
			WHERE t.user.id = :userId
			ORDER BY q.place.name ASC
			""")
	List<Place> findPlacesVisitedByUser(@Param("userId") UUID userId);

	Optional<Place> findByStaffRegistrationKeyDigestAndActiveTrue(String staffRegistrationKeyDigest);
}
