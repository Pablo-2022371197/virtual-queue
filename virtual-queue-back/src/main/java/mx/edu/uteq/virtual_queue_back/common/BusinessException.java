package mx.edu.uteq.virtual_queue_back.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

public class BusinessException extends RuntimeException {

	private final ErrorCode code;
	private final HttpStatus status;

	public BusinessException(ErrorCode code, String message, HttpStatus status) {
		super(message);
		this.code = code;
		this.status = status;
	}

	public BusinessException(ErrorCode code, String message) {
		this(code, message, HttpStatus.CONFLICT);
	}

	public ErrorCode getCode() {
		return code;
	}

	public HttpStatus getStatus() {
		return status;
	}

	public ProblemDetail toProblemDetail() {
		ProblemDetail detail = ProblemDetail.forStatusAndDetail(status, getMessage());
		detail.setProperty("code", code.name());
		return detail;
	}
}
