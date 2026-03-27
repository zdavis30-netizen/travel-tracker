import { useMemo, useState } from 'react';
import { format, parseISO, addDays, subDays, isWeekend } from 'date-fns';
import { getEventsForPersonOnDate, getTogetherOnDate, getNotesForDate } from '../../utils/eventUtils';
import { isDateToday } from '../../utils/dateUtils';

// ── Chips ─────────────────────────────────────────────────────────────────────

function LocationChip({ event }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
        <span className="opacity-70">📍</span>
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
      {event.fromCity && event.toCity && (
        <span className="opacity-60">{event.fromCity}→{event.toCity}</span>
      )}
    </span>
  );
}

function HotelChip({ event }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${
      event.needsBooking
        ? 'bg-red-50 text-red-700 border-red-200 font-semibold'
        : 'bg-teal-50 text-teal-700 border-teal-100 font-medium'
    }`}>
      {event.needsBooking && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
      <span>🏨</span>
      <span>{event.hotelName || event.city}</span>
    </span>
  );
}

function PersonEvents({ events }) {
  if (events.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {events.map((ev, i) => {
        if (ev.type === 'location') return <LocationChip key={i} event={ev} />;
        if (ev.type === 'flight')   return <FlightChip   key={i} event={ev} />;
        if (ev.type === 'hotel')    return <HotelChip    key={i} event={ev} />;
        return null;
      })}
    </div>
  );
}

// ── Day Row ───────────────────────────────────────────────────────────────────

function DayRow({ dateStr, events, onDayClick, onAddEntry, isReadOnly }) {
  const today    = isDateToday(dateStr);
  const together = getTogetherOnDate(events, dateStr);
  const zachEvents    = getEventsForPersonOnDate(events, 'zach',    dateStr);
  const arianneEvents = getEventsForPersonOnDate(events, 'arianne', dateStr);
  const notes    = getNotesForDate(events, dateStr);

  const hasContent = zachEvents.length > 0 || arianneEvents.length > 0 || notes.length > 0 || together;

  const date    = parseISO(dateStr);
  const dayName = format(date, 'EEE');
  const dayNum  = format(date, 'MMM d');
  const weekend = isWeekend(date);

  if (!hasContent) {
    // Compact empty row
    return (
      <div
        className={`flex items-center border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50/80 ${
          today ? 'border-l-4 border-l-indigo-400 bg-indigo-50/20' : weekend ? 'bg-gray-50/30' : 'bg-white'
        }`}
        onClick={() => onDayClick?.(dateStr)}
      >
        <div className={`w-24 flex-shrink-0 px-4 py-2 flex flex-col justify-center ${today ? 'bg-indigo-50/30' : ''}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-widest leading-none ${
            today ? 'text-indigo-500' : weekend ? 'text-gray-400' : 'text-gray-300'
          }`}>{today ? 'Today' : dayName}</span>
          <span className={`text-xs font-bold mt-0.5 ${
            today ? 'text-indigo-700' : weekend ? 'text-gray-500' : 'text-gray-300'
          }`}>{dayNum}</span>
        </div>
        <div className="flex-1 h-9 border-l border-gray-50" />
        <div className="flex-1 h-9 border-l border-gray-50" />
        {!isReadOnly && (
          <div className="w-8 flex-shrink-0 flex items-center justify-center border-l border-gray-50">
            <button
              onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr); }}
              className="opacity-0 hover:opacity-100 text-gray-300 hover:text-indigo-400 text-lg leading-none cursor-pointer transition-all"
              title="Add event"
            >+</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col border-b transition-colors cursor-pointer group ${
        today
          ? 'border-indigo-100 bg-indigo-50/20 border-l-4 border-l-indigo-400'
          : 'border-gray-100 bg-white hover:bg-gray-50/60'
      }`}
      onClick={() => onDayClick?.(dateStr)}
    >
      {/* Main row */}
      <div className="flex">
        {/* Date label */}
        <div className={`w-24 flex-shrink-0 px-4 py-3 flex flex-col justify-start ${today ? 'bg-indigo-50/30' : ''}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${
            today ? 'text-indigo-500' : 'text-gray-400'
          }`}>
            {today ? 'Today' : dayName}
          </span>
          <span className={`text-sm font-bold leading-tight mt-0.5 ${
            today ? 'text-indigo-700' : 'text-gray-800'
          }`}>
            {dayNum}
          </span>
          {together && (
            <span className="text-sm mt-1.5" title="Together">💚</span>
          )}
        </div>

        {/* Zach */}
        <div className="flex-1 px-3 py-3 border-l border-cyan-100/70 bg-cyan-50/10 min-h-[52px]">
          <PersonEvents events={zachEvents} />
        </div>

        {/* Arianne */}
        <div className="flex-1 px-3 py-3 border-l border-purple-100/70 bg-purple-50/10 min-h-[52px]">
          <PersonEvents events={arianneEvents} />
        </div>

        {/* Add button */}
        {!isReadOnly && (
          <div className="w-8 flex-shrink-0 flex items-center justify-center border-l border-gray-100">
            <button
              onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr); }}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-indigo-400 text-lg leading-none cursor-pointer transition-all"
              title="Add event"
            >+</button>
          </div>
        )}
      </div>

      {/* Notes strip */}
      {notes.length > 0 && (
        <div className="border-t border-amber-100 bg-amber-50/60 px-4 py-2 flex flex-col gap-1">
          {notes.map((note, i) => (
            <div key={note.id || i} className="flex items-start gap-2">
              <span className="text-amber-400 text-xs mt-0.5 flex-shrink-0">📝</span>
              <p className="text-xs text-gray-600 leading-snug">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Month separator ───────────────────────────────────────────────────────────

function MonthHeader({ dateStr }) {
  return (
    <div className="px-4 py-2.5 bg-white sticky top-0 z-10 border-b border-gray-100">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        {format(parseISO(dateStr), 'MMMM yyyy')}
      </span>
    </div>
  );
}

// ── Column header ─────────────────────────────────────────────────────────────

function ColumnHeader({ isReadOnly }) {
  return (
    <div className="flex border-b border-gray-100 bg-white sticky top-0 z-20">
      <div className="w-24 flex-shrink-0 px-4 py-2.5" />
      <div className="flex-1 px-3 py-2.5 border-l border-cyan-100/70">
        <span className="text-xs font-semibold text-cyan-600 tracking-wide">Zach</span>
      </div>
      <div className="flex-1 px-3 py-2.5 border-l border-purple-100/70">
        <span className="text-xs font-semibold text-purple-600 tracking-wide">Arianne</span>
      </div>
      {!isReadOnly && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}

// ── Day count helpers ─────────────────────────────────────────────────────────

function buildUpcomingDays(count = 120) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) =>
    format(addDays(today, i), 'yyyy-MM-dd')
  );
}

function buildPastDays(count = 90) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) =>
    format(subDays(today, count - i), 'yyyy-MM-dd')
  );
}

// ── Main ListView ─────────────────────────────────────────────────────────────

export function ListView({ events, onDayClick, onAddEntry, isReadOnly }) {
  const [showArchive, setShowArchive] = useState(false);

  const upcomingDays = useMemo(() => buildUpcomingDays(120), []);
  const pastDays     = useMemo(() => buildPastDays(90),     []);
  const days = showArchive ? pastDays : upcomingDays;

  let lastMonth = null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
      {/* Archive toggle */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {showArchive ? 'Past 90 days' : 'Upcoming 4 months'}
        </span>
        <button
          onClick={() => setShowArchive(v => !v)}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium cursor-pointer transition-colors"
        >
          {showArchive ? '← Upcoming' : 'Archive →'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <ColumnHeader isReadOnly={isReadOnly} />
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
