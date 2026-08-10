// Set this to the real first day of your convention (local server time,
// midnight). Update once before the event and redeploy.
export const CONVENTION_START_DATE = '2026-08-12'; // YYYY-MM-DD — Day 1: Aug 12, Day 2: Aug 13, Day 3: Aug 14

/**
 * Returns 1, 2, or 3 based on how many days have passed since
 * CONVENTION_START_DATE. Clamped so anything before day 1 counts as day 1,
 * and anything after day 3 counts as day 3 (prizes simply run out).
 */
export function getConventionDay(now = new Date()) {
  const start = new Date(`${CONVENTION_START_DATE}T00:00:00`);
  const diffMs = now.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const day = diffDays + 1;
  return Math.min(3, Math.max(1, day));
}
