/** Maps counter index 1 → A, 2 → B, … */
export function counterLabel(n: number | null | undefined): string {
  if (n == null || n < 1) return '—'
  if (n <= 26) return String.fromCharCode(64 + n)
  return String(n)
}
