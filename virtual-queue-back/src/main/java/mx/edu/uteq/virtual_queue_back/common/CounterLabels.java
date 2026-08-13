package mx.edu.uteq.virtual_queue_back.common;

public final class CounterLabels {

	private CounterLabels() {
	}

	/** Maps counter index to display label according to place mode (null-safe). */
	public static String toLabel(Integer counterNumber, CounterLabelMode mode) {
		if (counterNumber == null || counterNumber < 1) {
			return null;
		}
		CounterLabelMode effective = mode != null ? mode : CounterLabelMode.LETTERS;
		if (effective == CounterLabelMode.NUMBERS) {
			return String.valueOf(counterNumber);
		}
		if (counterNumber <= 26) {
			return String.valueOf((char) ('A' + counterNumber - 1));
		}
		return String.valueOf(counterNumber);
	}

	/** Default: letters (backward compatible). */
	public static String toLabel(Integer counterNumber) {
		return toLabel(counterNumber, CounterLabelMode.LETTERS);
	}
}
