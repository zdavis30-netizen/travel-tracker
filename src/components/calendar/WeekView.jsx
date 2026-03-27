import { useState } from 'react';
import {
  getCurrentWeekStart,
  getWeekDays,
  getWeekEnd,
  navigateWeek,
  formatWeekLabel,
  formatShortDayName,
  formatDayNumber,
  isDateToday,
} from '../../utils/dateUtils';
import { getEventsForPersonOnDate, getTogetherOnDate } from '../../utils/eventUtils';

// ── Chip components ───────────────────────────────────────────────────────────

function LocationChip({ event }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
        <span className="opacity-60">📍</span>
        <span>{event.city}</span>
      </span>
      {event.hasKids && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
          <span>👧</span>
          <span>Kids</span>
        </span>
      )}
    </div>
  );
}

function FlightChip({ event }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${
      event.needsBooking
        ? 'bg-red-50 text-red-700 border-red-200 font-semibold'
        : 'bg-sky-50 text-sky-700 border-sky-100 font-medium'
    }`}>
      {event.needsBooking && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
      <span>✈</span>
      <span>{event.flightNumber}</span>
    </span>
  );
}

function HotelChip({ event }) {
  const label = event.hotelName || event.city;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${
      event.needsBooking
        ? 'bg-red-50 text-red-700 border-red-200 font-semibold'
        : 'bg-teal-50 text-teal-700 border-teal-100 font-medium'
    }`}>
      {event.needsBooking && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
      <span>🏨</span>
      <span>{label}</span>
    </span>
  );
}

function EventChips({ events }) {
  return (
    <div className="flex flex-col gap-1 min-h-0">
      {events.map(ev => {
        if (ev.type === 'location') return <LocationChip key={ev.id || ev.city + ev.dateFrom}    event={ev} />;
        if (ev.type === 'flight')   return <FlightChip   key={ev.id || ev.flightNumber + ev.date} event={ev} />;
        if (ev.type === 'hotel')    return <HotelChip    key={ev.id || ev.hotelName + ev.dateFrom} event={ev} />;
        return null;
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WeekView({ events, onAddEntry, isReadOnly, onDayClick }) {
  const [weekStart, setWeekStart] = useState(() => getCurrentWeekStart());

  const weekEnd  = getWeekEnd(weekStart);
  const days     = getWeekDays(weekStart);
  const weekLabel = formatWeekLabel(weekStart, weekEnd);

  function handlePrev() { setWeekStart(w => navigateWeek(w, -1)); }
  function handleNext() { setWeekStart(w => navigateWeek(w,  1)); }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Week navigation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Previous week"
        >
          ←
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800">{weekLabel}</span>
          <button
            onClick={() => setWeekStart(getCurrentWeekStart())}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium cursor-pointer transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={handleNext}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Next week"
        >
          →
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '680px' }}>
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-20 px-3 py-3 text-left border-r border-gray-100" />
                {days.map(dateStr => {
                  const today = isDateToday(dateStr);
                  return (
                    <th
                      key={dateStr}
                      className={`px-2 py-3 text-center border-r border-gray-50 last:border-r-0 cursor-pointer group transition-colors ${
                        today ? 'bg-indigo-50/50' : 'hover:bg-gray-50/60'
                      }`}
                      style={{ minWidth: '110px' }}
                      onClick={() => onDayClick?.(dateStr)}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                          {formatShortDayName(dateStr)}
                        </span>
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                          today
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 group-hover:bg-gray-100'
                        }`}>
                          {formatDayNumber(dateStr)}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Zach row */}
              <tr className="border-b border-gray-100">
                <td className="px-3 py-3 border-r border-gray-100 bg-cyan-50/40">
                  <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">Zach</span>
                </td>
                {days.map(dateStr => {
                  const dayEvents = getEventsForPersonOnDate(events, 'zach', dateStr);
                  const today = isDateToday(dateStr);
                  return (
                    <td
                      key={dateStr}
                      className={`px-2 py-2.5 align-top border-r border-gray-50 last:border-r-0 cursor-pointer transition-colors ${
                        today ? 'bg-indigo-50/20' : 'bg-cyan-50/10 hover:bg-cyan-50/30'
                      }`}
                      style={{ minWidth: '110px' }}
                      onClick={() => onDayClick?.(dateStr)}
                    >
                      <div className="flex flex-col gap-1">
                        <EventChips events={dayEvents} />
                        {!isReadOnly && (
                          <button
                            onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr); }}
                            className="mt-0.5 text-xs text-gray-200 hover:text-indigo-400 transition-colors cursor-pointer"
                            title="Add event"
                          >+</button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Arianne row */}
              <tr className="border-b border-gray-100">
                <td className="px-3 py-3 border-r border-gray-100 bg-purple-50/40">
                  <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Arianne</span>
                </td>
                {days.map(dateStr => {
                  const dayEvents = getEventsForPersonOnDate(events, 'arianne', dateStr);
                  const today = isDateToday(dateStr);
                  return (
                    <td
                      key={dateStr}
                      className={`px-2 py-2.5 align-top border-r border-gray-50 last:border-r-0 cursor-pointer transition-colors ${
                        today ? 'bg-indigo-50/20' : 'bg-purple-50/10 hover:bg-purple-50/30'
                      }`}
                      style={{ minWidth: '110px' }}
                      onClick={() => onDayClick?.(dateStr)}
                    >
                      <div className="flex flex-col gap-1">
                        <EventChips events={dayEvents} />
                        {!isReadOnly && (
                          <button
                            onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr); }}
                            className="mt-0.5 text-xs text-gray-200 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Add event"
                          >+</button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Together row */}
              <tr>
                <td className="px-3 py-2.5 border-r border-gray-100 bg-emerald-50/30 text-center">
                  <span className="text-sm">💚</span>
                </td>
                {days.map(dateStr => {
                  const isTogether = getTogetherOnDate(events, dateStr);
                  const today = isDateToday(dateStr);
                  return (
                    <td
                      key={dateStr}
                      className={`px-2 py-2 text-center border-r border-gray-50 last:border-r-0 ${
                        today ? 'bg-indigo-50/20' : ''
                      }`}
                      style={{ minWidth: '110px' }}
                    >
                      {isTogether && (
                        <span className="text-base">💚</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
