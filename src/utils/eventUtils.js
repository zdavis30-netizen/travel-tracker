import { parseISO, isWithinInterval } from 'date-fns';

// Returns true if a multi-day event (location/hotel) covers the given date
export function coversDate(event, dateStr) {
  const date = parseISO(dateStr);
  if (event.type === 'location' || event.type === 'hotel') {
    const start = parseISO(event.dateFrom);
    const end = parseISO(event.dateTo);
    return isWithinInterval(date, { start, end });
  }
  if (event.type === 'flight') {
    return event.date === dateStr;
  }
  return false;
}

// Returns all events for a specific person on a specific date
export function getEventsForPersonOnDate(events, person, dateStr) {
  return events.filter(
    e => e.person === person && coversDate(e, dateStr)
  );
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
