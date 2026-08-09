package mx.edu.uteq.virtual_queue_back.user.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
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
}
