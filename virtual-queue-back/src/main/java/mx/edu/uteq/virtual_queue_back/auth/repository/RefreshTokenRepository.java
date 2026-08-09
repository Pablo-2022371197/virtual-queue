package mx.edu.uteq.virtual_queue_back.auth.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import mx.edu.uteq.virtual_queue_back.auth.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

	Optional<RefreshToken> findByTokenHash(String tokenHash);

	List<RefreshToken> findByFamilyIdAndRevokedAtIsNull(UUID familyId);
}
