package mx.edu.uteq.virtual_queue_back.common;

public final class CounterLabels {

	private CounterLabels() {
	}

	/** Maps 1 → A, 2 → B, … (null-safe). */
	public static String toLabel(Integer counterNumber) {
		if (counterNumber == null || counterNumber < 1) {
			return null;
		}
		if (counterNumber <= 26) {
			return String.valueOf((char) ('A' + counterNumber - 1));
		}
		return String.valueOf(counterNumber);
	}
}
