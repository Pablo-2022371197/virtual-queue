package mx.edu.uteq.virtual_queue_back.common;

import java.util.EnumSet;
import java.util.Set;

public enum TicketStatus {
	WAITING,
	NEARLY,
	CALLED,
	SERVING,
	COMPLETED,
	CANCELLED,
	EXPIRED;

	public static final Set<TicketStatus> ACTIVE = EnumSet.of(WAITING, NEARLY, CALLED, SERVING);

	public boolean isActive() {
		return ACTIVE.contains(this);
	}
}
