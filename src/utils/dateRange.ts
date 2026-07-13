// Parses a single date-range boundary from a query param. Plain "YYYY-MM-DD"
// values (as sent by <input type="date">) are anchored to the start/end of
// that day in local time; full timestamps (e.g. ISO strings) are used as-is.
function parseDateBound(value: unknown, endOfDay: boolean): Date | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  const date = new Date(dateOnly ? `${value.trim()}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}` : value);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Resolves a createdAt/date-range filter from optional startDate/endDate
 * query params, falling back to "today" (local time) when neither is given.
 */
export function resolveDateRange(startDate: unknown, endDate: unknown): { start: Date; end: Date } {
  const start = parseDateBound(startDate, false);
  const end = parseDateBound(endDate, true);

  if (start || end) {
    return {
      start: start ?? new Date(0),
      end: end ?? new Date(),
    };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  return { start: todayStart, end: todayEnd };
}
