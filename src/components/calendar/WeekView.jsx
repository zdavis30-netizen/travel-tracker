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

// ── Chip components ──────────────────────────────────────────────────────────

function LocationChip({ event }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 leading-tight">
        <span>📍</span>
        <span>{event.city}</span>
      </span>
      {event.hasKids && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 leading-tight">
          <span>👧</span>
          <span>Kids</span>
        </span>
      )}
    </div>
  );
}

function FlightChip({ event }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border leading-tight ${
      event.needsBooking
        ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold'
        : 'bg-sky-50 text-sky-700 border-sky-200 font-medium'
    }`}>
      {event.needsBooking && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
      )}
      <span>✈</span>
      <span>{event.flightNumber}</span>
    </span>
  );
}

function HotelChip({ event }) {
  const label = event.hotelName || event.city;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border leading-tight ${
      event.needsBooking
        ? 'bg-teal-50 text-teal-700 border-teal-200 font-bold'
        : 'bg-teal-50 text-teal-700 border-teal-200 font-medium'
    }`}>
      {event.needsBooking && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
      )}
      <span>🏨</span>
      <span>{label}</span>
    </span>
  );
}

function EventChips({ events }) {
  return (
    <div className="flex flex-col gap-0.5 min-h-0">
      {events.map(ev => {
        if (ev.type === 'location') return <LocationChip key={ev.id || ev.city + ev.dateFrom} event={ev} />;
        if (ev.type === 'flight') return <FlightChip key={ev.id || ev.flightNumber + ev.date} event={ev} />;
        if (ev.type === 'hotel') return <HotelChip key={ev.id || ev.hotelName + ev.dateFrom} event={ev} />;
        return null;
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function WeekView({ events, onAddEntry, isReadOnly, onDayClick }) {
  const [weekStart, setWeekStart] = useState(() => getCurrentWeekStart());

  const weekEnd = getWeekEnd(weekStart);
  const days = getWeekDays(weekStart);
  const weekLabel = formatWeekLabel(weekStart, weekEnd);

  function handlePrev() { setWeekStart(w => navigateWeek(w, -1)); }
  function handleNext() { setWeekStart(w => navigateWeek(w, 1)); }

  return (
    <div className="max-w-full px-4 py-4">
      {/* Week navigation */}
      <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 cursor-pointer text-sm"
            aria-label="Previous week"
          >
            ← Prev
          </button>
          <span className="text-sm font-semibold text-gray-800 min-w-[160px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 cursor-pointer text-sm"
            aria-label="Next week"
          >
            Next →
          </button>
        </div>
        <button
          onClick={() => setWeekStart(getCurrentWeekStart())}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer transition-colors"
        >
          Today
        </button>
      </div>

      {/* Scrollable grid */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse" style={{ minWidth: '700px' }}>
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200">
              {/* Row label column */}
              <th className="w-20 px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-200" />
              {days.map(dateStr => {
                const today = isDateToday(dateStr);
                return (
                  <th
                    key={dateStr}
                    className="px-2 py-2 text-center border-r border-gray-100 last:border-r-0 cursor-pointer group"
                    style={{ minWidth: '120px' }}
                    onClick={() => onDayClick?.(dateStr)}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {formatShortDayName(dateStr)}
                      </span>
                      <span
                        className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                          today
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-800 group-hover:bg-gray-100'
                        }`}
                      >
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
              <td className="px-3 py-2 border-r border-gray-200 bg-cyan-50">
                <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">Zach</span>
              </td>
              {days.map(dateStr => {
                const dayEvents = getEventsForPersonOnDate(events, 'zach', dateStr);
                return (
                  <td
                    key={dateStr}
                    className="px-2 py-2 align-top bg-cyan-50/30 border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-cyan-50/60 transition-colors"
                    style={{ minWidth: '120px' }}
                    onClick={() => onDayClick?.(dateStr)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <EventChips events={dayEvents} />
                      {!isReadOnly && (
                        <button
                          onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr); }}
                          className="mt-1 text-xs text-gray-300 hover:text-indigo-400 transition-colors cursor-pointer leading-none"
                          title="Add event"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Arianne row */}
            <tr className="border-b border-gray-100">
              <td className="px-3 py-2 border-r border-gray-200 bg-purple-50">
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Arianne</span>
              </td>
              {days.map(dateStr => {
                const dayEvents = getEventsForPersonOnDate(events, 'arianne', dateStr);
                return (
                  <td
                    key={dateStr}
                    className="px-2 py-2 align-top bg-purple-50/30 border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-purple-50/60 transition-colors"
                    style={{ minWidth: '120px' }}
                    onClick={() => onDayClick?.(dateStr)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <EventChips events={dayEvents} />
                      {!isReadOnly && (
                        <button
                          onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr); }}
                          className="mt-1 text-xs text-gray-300 hover:text-rose-400 transition-colors cursor-pointer leading-none"
                          title="Add event"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Together row */}
            <tr>
              <td className="px-3 py-2 border-r border-gray-200 bg-emerald-50 text-center">
                <span className="text-base">💚</span>
              </td>
              {days.map(dateStr => {
                const isTogether = getTogetherOnDate(events, dateStr);
                return (
                  <td
                    key={dateStr}
                    className="px-2 py-1.5 border-r border-gray-100 last:border-r-0"
                    style={{ minWidth: '120px' }}
                  >
                    {isTogether && (
                      <div className="flex items-center justify-center px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                        <span className="text-base">💚</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
