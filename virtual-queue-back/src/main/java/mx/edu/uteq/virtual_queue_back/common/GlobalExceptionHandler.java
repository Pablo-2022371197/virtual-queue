package mx.edu.uteq.virtual_queue_back.common;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ProblemDetail> handleBusiness(BusinessException ex) {
		return ResponseEntity.status(ex.getStatus()).body(ex.toProblemDetail());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex) {
		String message = ex.getBindingResult().getFieldErrors().stream()
				.map(FieldError::getDefaultMessage)
				.collect(Collectors.joining("; "));
		ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
		detail.setProperty("code", ErrorCode.VALIDATION_ERROR.name());
		return ResponseEntity.badRequest().body(detail);
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ProblemDetail> handleBadCredentials(BadCredentialsException ex) {
		ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Invalid credentials");
		detail.setProperty("code", ErrorCode.UNAUTHORIZED.name());
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(detail);
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<ProblemDetail> handleAuth(AuthenticationException ex) {
		ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
		detail.setProperty("code", ErrorCode.UNAUTHORIZED.name());
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(detail);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex) {
		ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Access denied");
		detail.setProperty("code", ErrorCode.FORBIDDEN.name());
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(detail);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ProblemDetail> handleGeneric(Exception ex) {
		ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
		detail.setProperty("code", ErrorCode.INTERNAL_ERROR.name());
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(detail);
	}
}
