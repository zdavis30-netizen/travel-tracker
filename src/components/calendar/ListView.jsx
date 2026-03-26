import { useMemo } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { getEventsForPersonOnDate, getTogetherOnDate } from '../../utils/eventUtils';
import { isDateToday } from '../../utils/dateUtils';

// ── Chips ─────────────────────────────────────────────────────────────────────

function LocationChip({ event }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 border border-blue-200 leading-tight">
        <span>📍</span>
        <span>{event.city}</span>
      </span>
      {event.hasKids && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 leading-tight">
          👧 Kids
        </span>
      )}
    </div>
  );
}

function FlightChip({ event }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border leading-tight
      ${event.needsBooking ? 'bg-amber-100 text-amber-800 border-amber-200 font-bold' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
      {event.needsBooking && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
      <span>✈</span>
      <span>{event.flightNumber}</span>
      {event.fromCity && event.toCity && (
        <span className="text-amber-600">{event.fromCity} → {event.toCity}</span>
      )}
    </span>
  );
}

function HotelChip({ event }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border leading-tight
      ${event.needsBooking ? 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
      {event.needsBooking && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
      <span>🏨</span>
      <span>{event.hotelName || event.city}</span>
    </span>
  );
}

function PersonEvents({ events }) {
  if (events.length === 0) return <span className="text-xs text-gray-300">—</span>;
  return (
    <div className="flex flex-col gap-1">
      {events.map((ev, i) => {
        if (ev.type === 'location') return <LocationChip key={i} event={ev} />;
        if (ev.type === 'flight') return <FlightChip key={i} event={ev} />;
        if (ev.type === 'hotel') return <HotelChip key={i} event={ev} />;
        return null;
      })}
    </div>
  );
}

// ── List row for one day ──────────────────────────────────────────────────────

function DayRow({ dateStr, events, onDayClick, onAddEntry, isReadOnly }) {
  const today = isDateToday(dateStr);
  const together = getTogetherOnDate(events, dateStr);
  const zachEvents = getEventsForPersonOnDate(events, 'zach', dateStr);
  const arianneEvents = getEventsForPersonOnDate(events, 'arianne', dateStr);

  const date = parseISO(dateStr);
  const dayName = format(date, 'EEE');
  const dayNum = format(date, 'MMM d');

  return (
    <div
      className={`flex border-b border-gray-100 transition-colors cursor-pointer hover:bg-gray-50/60
        ${today ? 'bg-indigo-50/30' : 'bg-white'}`}
      onClick={() => onDayClick?.(dateStr)}
    >
      {/* Date label */}
      <div className={`w-20 flex-shrink-0 px-3 py-3 flex flex-col justify-start
        ${today ? 'bg-indigo-50' : 'bg-gray-50'}`}>
        <span className={`text-xs font-semibold uppercase tracking-wide
          ${today ? 'text-indigo-500' : 'text-gray-400'}`}>
          {today ? 'Today' : dayName}
        </span>
        <span className={`text-sm font-bold leading-tight
          ${today ? 'text-indigo-700' : 'text-gray-700'}`}>
          {dayNum}
        </span>
        {together && <span className="text-base mt-1">💚</span>}
      </div>

      {/* Zach */}
      <div className="flex-1 px-3 py-3 border-l border-indigo-100 bg-indigo-50/20 min-h-[52px]">
        <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide mb-1">Zach</div>
        <PersonEvents events={zachEvents} />
      </div>

      {/* Arianne */}
      <div className="flex-1 px-3 py-3 border-l border-rose-100 bg-rose-50/20 min-h-[52px]">
        <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide mb-1">Arianne</div>
        <PersonEvents events={arianneEvents} />
      </div>

      {/* Add button */}
      {!isReadOnly && (
        <div className="w-8 flex-shrink-0 flex items-center justify-center border-l border-gray-100">
          <button
            onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr); }}
            className="text-gray-300 hover:text-indigo-400 text-lg leading-none cursor-pointer transition-colors"
            title="Add event"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

// ── Month separator ───────────────────────────────────────────────────────────

function MonthHeader({ dateStr }) {
  return (
    <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        {format(parseISO(dateStr), 'MMMM yyyy')}
      </span>
    </div>
  );
}

// ── Main ListView ─────────────────────────────────────────────────────────────

// Build 90 days starting from today (or a given start date)
function buildDays(count = 120) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) =>
    format(addDays(today, i - 7), 'yyyy-MM-dd') // start 7 days before today
  );
}

export function ListView({ events, onDayClick, onAddEntry, isReadOnly }) {
  const days = useMemo(() => buildDays(127), []); // 7 before + 120 ahead

  let lastMonth = null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {days.map(dateStr => {
          const month = dateStr.slice(0, 7);
          const showMonthHeader = month !== lastMonth;
          lastMonth = month;

          return (
            <div key={dateStr}>
              {showMonthHeader && <MonthHeader dateStr={dateStr} />}
              <DayRow
                dateStr={dateStr}
                events={events}
                onDayClick={onDayClick}
                onAddEntry={onAddEntry}
                isReadOnly={isReadOnly}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
