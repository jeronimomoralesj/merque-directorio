// Set this to the real first day of your convention (local server time,
// midnight). Update once before the event and redeploy.
export const CONVENTION_START_DATE = '2026-09-21T00:00:00-05:00'; // Bogotá
export const CONVENTION_TOTAL_DAYS = 3;

const MS_PER_DAY = 86_400_000;

// Calendar-day difference in whole days, immune to DST and timezone offsets.
// Uses Date.UTC on the local Y/M/D so a 23h or 25h day still counts as 1.
function calendarDaysBetween(from, to) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * Returns 1, 2, or 3 based on how many days have passed since
 * CONVENTION_START_DATE. Clamped so anything before day 1 counts as day 1,
 * and anything after day 3 counts as day 3 (prizes simply run out).
 */
export function getConventionDay(now = new Date()) {
  const start = new Date(`${CONVENTION_START_DATE}T00:00:00`);
  const day = calendarDaysBetween(start, now) + 1;
  return Math.min(CONVENTION_TOTAL_DAYS, Math.max(1, day));
}

/**
 * Returns true only when today falls within the convention days (Day 1–3).
 * Returns false before the event starts or after it ends.
 */
export function isConventionDay(now = new Date()) {
  const start = new Date(`${CONVENTION_START_DATE}T00:00:00`);
  const diffDays = calendarDaysBetween(start, now);
  return diffDays >= 0 && diffDays < CONVENTION_TOTAL_DAYS;
}