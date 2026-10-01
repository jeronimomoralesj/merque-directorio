// First day of the convention (local server time). Plain YYYY-MM-DD.
export const CONVENTION_START_DATE = '2026-09-30'; // Sept 30, Oct 1, Oct 2
export const CONVENTION_TOTAL_DAYS = 3;

const MS_PER_DAY = 86_400_000;

// Parse 'YYYY-MM-DD' as a LOCAL midnight date.
function parseLocalDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Calendar-day difference in whole days, immune to DST and timezone offsets.
function calendarDaysBetween(from, to) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * Returns 1, 2, or 3 based on how many days have passed since
 * CONVENTION_START_DATE. Clamped so anything before day 1 counts as day 1,
 * and anything after day 3 counts as day 3.
 */
export function getConventionDay(now = new Date()) {
  const start = parseLocalDate(CONVENTION_START_DATE);
  const day = calendarDaysBetween(start, now) + 1;
  return Math.min(CONVENTION_TOTAL_DAYS, Math.max(1, day));
}

/**
 * Returns true only when today falls within the convention days (Day 1–3).
 */
export function isConventionDay(now = new Date()) {
  const start = parseLocalDate(CONVENTION_START_DATE);
  const diffDays = calendarDaysBetween(start, now);
  return diffDays >= 0 && diffDays < CONVENTION_TOTAL_DAYS;
}