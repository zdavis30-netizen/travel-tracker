import { parseISO, isWithinInterval } from 'date-fns';

// Returns true if a multi-day event covers the given date
export function coversDate(event, dateStr) {
  const date = parseISO(dateStr);
  if (event.type === 'location' || event.type === 'hotel' || event.type === 'together') {
    const start = parseISO(event.dateFrom);
    const end = parseISO(event.dateTo);
    return isWithinInterval(date, { start, end });
  }
  if (event.type === 'flight' || event.type === 'note') {
    return event.date === dateStr;
  }
  return false;
}

// Returns all notes for a specific date
export function getNotesForDate(events, dateStr) {
  return events.filter(e => e.type === 'note' && e.date === dateStr);
}

// Returns all events for a specific person on a specific date
export function getEventsForPersonOnDate(events, person, dateStr) {
  return events.filter(e => e.person === person && coversDate(e, dateStr));
}

// Returns true if any "together" event covers the given date
export function getTogetherOnDate(events, dateStr) {
  return events.some(e => e.type === 'together' && coversDate(e, dateStr));
}

// Resolves a display city for a person on a given date, preferring flight destination
export function resolveDisplayCity(events) {
  const flight = events.find(e => e.type === 'flight');
  if (flight) return flight.toCity;
  const hotel = events.find(e => e.type === 'hotel');
  if (hotel) return hotel.city;
  const location = events.find(e => e.type === 'location');
  if (location) return location.city;
  return null;
}
