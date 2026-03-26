import {
  eachDayOfInterval,
  format,
  parseISO,
  isToday,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  addWeeks,
  addMonths,
  startOfMonth,
  endOfMonth,
  addDays,
} from 'date-fns';

export function buildDayList(startStr, endStr) {
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}

export function formatDayLabel(dateStr) {
  return format(parseISO(dateStr), 'EEE, MMM d');
}

export function formatMonthLabel(dateStr) {
  return format(parseISO(dateStr), 'MMMM yyyy');
}

export function isDateToday(dateStr) {
  return isToday(parseISO(dateStr));
}

export function isSameMonthAs(dateStr, prevDateStr) {
  if (!prevDateStr) return false;
  return isSameMonth(parseISO(dateStr), parseISO(prevDateStr));
}

// ── Week utilities ───────────────────────────────────────────────────────────

export function getWeekStart(dateStr) {
  const d = parseISO(dateStr);
  return format(startOfWeek(d, { weekStartsOn: 0 }), 'yyyy-MM-dd');
}

export function getWeekEnd(dateStr) {
  const d = parseISO(dateStr);
  return format(endOfWeek(d, { weekStartsOn: 0 }), 'yyyy-MM-dd');
}

export function getWeekDays(weekStartStr) {
  const start = parseISO(weekStartStr);
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
}

export function navigateWeek(weekStartStr, direction) {
  return format(addWeeks(parseISO(weekStartStr), direction), 'yyyy-MM-dd');
}

export function formatWeekLabel(startStr, endStr) {
  const s = parseISO(startStr);
  const e = parseISO(endStr);
  const startMonth = format(s, 'MMM');
  const endMonth = format(e, 'MMM');
  const year = format(e, 'yyyy');
  if (startMonth === endMonth) {
    return `${startMonth} ${format(s, 'd')} \u2013 ${format(e, 'd')}, ${year}`;
  }
  return `${startMonth} ${format(s, 'd')} \u2013 ${endMonth} ${format(e, 'd')}, ${year}`;
}

export function formatShortDayName(dateStr) {
  return format(parseISO(dateStr), 'EEE');
}

export function formatDayNumber(dateStr) {
  return format(parseISO(dateStr), 'd');
}

export function getCurrentWeekStart() {
  return getWeekStart(format(new Date(), 'yyyy-MM-dd'));
}

// ── Month utilities ──────────────────────────────────────────────────────────

// monthStr is like "2026-03"
export function formatMonthYearLabel(monthStr) {
  return format(parseISO(`${monthStr}-01`), 'MMMM yyyy');
}

export function getCurrentMonth() {
  return format(new Date(), 'yyyy-MM');
}

export function navigateMonth(monthStr, direction) {
  return format(addMonths(parseISO(`${monthStr}-01`), direction), 'yyyy-MM');
}

export function isCurrentMonth(dateStr, monthStr) {
  return isSameMonth(parseISO(dateStr), parseISO(`${monthStr}-01`));
}

// Returns array of week arrays (each week is 7 date strings) for the full
// calendar grid of a month, padded with days from adjacent months.
export function getMonthWeeks(monthStr) {
  const monthStart = startOfMonth(parseISO(`${monthStr}-01`));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd }).map(d =>
    format(d, 'yyyy-MM-dd')
  );

  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  return weeks;
}
