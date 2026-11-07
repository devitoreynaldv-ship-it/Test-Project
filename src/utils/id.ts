/**
 * Collision-safe id generator. `Date.now()` alone collides when two records are
 * created in the same millisecond (e.g. a sale + its stock mutation).
 */
export function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}

/** "YYYY-MM-DD HH:mm" timestamp anchored to the record's business date. */
export function stampFor(date: string): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${date} ${hh}:${mm}`;
}
