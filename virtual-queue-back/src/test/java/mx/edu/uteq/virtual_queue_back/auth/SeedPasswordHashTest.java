package mx.edu.uteq.virtual_queue_back.auth;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class SeedPasswordHashTest {

	private static final String SEED_HASH = "$2a$10$BrVSM2MSRsm6LhYXSc6Q6ubNKXw.TKDL1K8pCuCuQv.l/yJokLcNC";

	@Test
	void seedHashMatchesPassword() {
		assertTrue(new BCryptPasswordEncoder().matches("password", SEED_HASH));
	}
}
