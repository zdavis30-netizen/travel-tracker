import { useMemo, useState } from 'react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { getEventsForPersonOnDate, getTogetherOnDate, getNotesForDate } from '../../utils/eventUtils';
import { isDateToday } from '../../utils/dateUtils';

// ── Chips ─────────────────────────────────────────────────────────────────────

function LocationChip({ event }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
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
      {event.needsBooking && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
      <span>✈</span>
      <span>{event.flightNumber}</span>
      {event.fromCity && event.toCity && (
        <span className="text-sky-500">{event.fromCity} → {event.toCity}</span>
      )}
    </span>
  );
}

function HotelChip({ event }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border leading-tight ${
      event.needsBooking
        ? 'bg-teal-50 text-teal-700 border-teal-200 font-bold'
        : 'bg-teal-50 text-teal-700 border-teal-200 font-medium'
    }`}>
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
  const notes = getNotesForDate(events, dateStr);

  const date = parseISO(dateStr);
  const dayName = format(date, 'EEE');
  const dayNum = format(date, 'MMM d');

  const hasContent = zachEvents.length > 0 || arianneEvents.length > 0 || notes.length > 0 || together;

  return (
    <div
      className={`flex flex-col border-b border-gray-100 transition-colors cursor-pointer hover:bg-gray-50/60
        ${today ? 'border-l-4 border-l-indigo-500 bg-indigo-50/20' : 'bg-white'}`}
      onClick={() => onDayClick?.(dateStr)}
    >
      {/* Main row: date + person columns */}
      <div className="flex">
        {/* Date label */}
        <div className={`w-24 flex-shrink-0 px-3 py-3 flex flex-col justify-start
          ${today ? 'bg-indigo-50/40' : ''}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-widest
            ${today ? 'text-indigo-500' : 'text-gray-400'}`}>
            {today ? 'Today' : dayName}
          </span>
          <span className={`text-sm font-bold leading-tight mt-0.5
            ${today ? 'text-indigo-700' : 'text-gray-700'}`}>
            {dayNum}
          </span>
          {together && <span className="text-base mt-1">💚</span>}
        </div>

        {/* Zach */}
        <div className={`flex-1 px-3 py-3 border-l border-cyan-100 bg-cyan-50/10 ${hasContent ? 'min-h-[52px]' : 'min-h-[40px]'}`}>
          <PersonEvents events={zachEvents} />
        </div>

        {/* Arianne */}
        <div className={`flex-1 px-3 py-3 border-l border-purple-100 bg-purple-50/10 ${hasContent ? 'min-h-[52px]' : 'min-h-[40px]'}`}>
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

      {/* Notes strip — full width, shown when notes exist */}
      {notes.length > 0 && (
        <div className="mx-0 border-t border-amber-100 bg-amber-50/60 px-4 py-2 flex flex-col gap-1">
          {notes.map((note, i) => (
            <div key={note.id || i} className="flex items-start gap-1.5">
              <span className="text-amber-500 text-xs mt-0.5 flex-shrink-0">📝</span>
              <p className="text-xs text-gray-700 leading-snug">{note.text}</p>
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
    <div className="px-4 py-2 bg-slate-100 sticky top-0 z-10">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        {format(parseISO(dateStr), 'MMMM yyyy')}
      </span>
    </div>
  );
}

// ── Column header ─────────────────────────────────────────────────────────────

function ColumnHeader() {
  return (
    <div className="flex border-b-2 border-gray-100 bg-white sticky top-0 z-20 shadow-sm">
      <div className="w-24 flex-shrink-0 px-3 py-2" />
      <div className="flex-1 px-3 py-2 border-l border-cyan-100 bg-cyan-50/30">
        <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Zach</span>
      </div>
      <div className="flex-1 px-3 py-2 border-l border-purple-100 bg-purple-50/30">
        <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Arianne</span>
      </div>
      <div className="w-8 flex-shrink-0" />
    </div>
  );
}

// ── Main ListView ─────────────────────────────────────────────────────────────

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
  // Go back `count` days, up to yesterday
  return Array.from({ length: count }, (_, i) =>
    format(subDays(today, count - i), 'yyyy-MM-dd')
  );
}

export function ListView({ events, onDayClick, onAddEntry, isReadOnly }) {
  const [showArchive, setShowArchive] = useState(false);

  const upcomingDays = useMemo(() => buildUpcomingDays(120), []);
  const pastDays = useMemo(() => buildPastDays(90), []);
  const days = showArchive ? pastDays : upcomingDays;

  let lastMonth = null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
      {/* Archive toggle */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-gray-700">
          {showArchive ? 'Past 90 days' : 'Upcoming'}
        </span>
        <button
          onClick={() => setShowArchive(v => !v)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer border border-indigo-200 rounded-full px-3 py-1 hover:bg-indigo-50 transition-colors"
        >
          {showArchive ? '← Back to Upcoming' : '🗂 Archive'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <ColumnHeader />
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
