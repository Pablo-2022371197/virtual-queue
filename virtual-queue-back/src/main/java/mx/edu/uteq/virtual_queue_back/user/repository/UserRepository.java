package mx.edu.uteq.virtual_queue_back.user.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import mx.edu.uteq.virtual_queue_back.user.entity.User;

public interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findByUsername(String username);

	Optional<User> findByEmail(String email);

	Optional<User> findByEmailIgnoreCase(String email);

	boolean existsByEmail(String email);

	boolean existsByUsername(String username);

	@Query("""
			SELECT u FROM User u
			LEFT JOIN FETCH u.place
			WHERE u.id = :id
			""")
	Optional<User> findByIdWithPlace(@Param("id") UUID id);

	@Query("""
			SELECT u FROM User u
			WHERE u.place.id = :placeId AND u.claimedCounter IS NOT NULL
			""")
	List<User> findByPlaceIdAndClaimedCounterIsNotNull(@Param("placeId") UUID placeId);

	@Query("""
			SELECT COUNT(u) FROM User u
			WHERE u.place.id = :placeId AND u.claimedCounter IS NOT NULL
			""")
	long countClaimedByPlaceId(@Param("placeId") UUID placeId);

	@Query("""
			SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END
			FROM User u
			WHERE u.place.id = :placeId
			  AND u.claimedCounter = :counter
			  AND u.id <> :excludeUserId
			""")
	boolean isCounterClaimedByOther(
			@Param("placeId") UUID placeId,
			@Param("counter") int counter,
			@Param("excludeUserId") UUID excludeUserId);

	@Modifying(clearAutomatically = true)
	@Query("""
			UPDATE User u SET u.claimedCounter = NULL
			WHERE u.place.id = :placeId AND u.claimedCounter > :maxCounter
			""")
	int clearClaimsAbove(@Param("placeId") UUID placeId, @Param("maxCounter") int maxCounter);

	@Modifying(clearAutomatically = true)
	@Query("""
			UPDATE User u SET u.claimedCounter = NULL
			WHERE u.id = :userId AND u.claimedCounter IS NOT NULL
			""")
	int clearClaimedCounter(@Param("userId") UUID userId);
}
