import {
  eachDayOfInterval,
  format,
  parseISO,
  isToday,
  isSameMonth,
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
