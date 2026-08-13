import type { CounterLabelMode } from '../types/api'

/** Maps counter index to display label according to place mode. */
export function counterLabel(
  n: number | null | undefined,
  mode: CounterLabelMode = 'LETTERS',
): string {
  if (n == null || n < 1) return '—'
  if (mode === 'NUMBERS') return String(n)
  if (n <= 26) return String.fromCharCode(64 + n)
  return String(n)
}
