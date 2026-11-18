package mx.edu.uteq.virtual_queue_back.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;

class GlobalExceptionHandlerTest {

	private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

	@Test
	void dataIntegrityOnActiveTicketIndexReturns409() {
		ResponseEntity<ProblemDetail> response = handler.handleDataIntegrity(
				new DataIntegrityViolationException("duplicate key violates idx_tickets_user_active"));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
		assertThat(response.getBody()).isNotNull();
		assertThat(response.getBody().getProperties().get("code"))
				.isEqualTo(ErrorCode.ACTIVE_TICKET_EXISTS.name());
	}

	@Test
	void genericDataIntegrityReturns409Conflict() {
		ResponseEntity<ProblemDetail> response = handler.handleDataIntegrity(
				new DataIntegrityViolationException("other constraint"));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
		assertThat(response.getBody()).isNotNull();
		assertThat(response.getBody().getProperties().get("code")).isEqualTo(ErrorCode.CONFLICT.name());
	}
}