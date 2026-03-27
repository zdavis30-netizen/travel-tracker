import { useMemo, useState } from 'react';
import { format, parseISO, addDays, subDays, isWeekend } from 'date-fns';
import { getEventsForPersonOnDate, getTogetherOnDate, getNotesForDate, getTravelEventsForDate, coversDate } from '../../utils/eventUtils';
import { isDateToday } from '../../utils/dateUtils';

// ── City summary helpers ───────────────────────────────────────────────────────

function buildCitySummary(events, upcomingDays) {
  const cityMap = {}; // city -> { zach: Set<dateStr>, arianne: Set<dateStr> }

  events
    .filter(e => e.type === 'location' && (e.person === 'zach' || e.person === 'arianne'))
    .forEach(event => {
      upcomingDays.forEach(dateStr => {
        if (coversDate(event, dateStr)) {
          if (!cityMap[event.city]) cityMap[event.city] = { zach: new Set(), arianne: new Set() };
          cityMap[event.city][event.person].add(dateStr);
        }
      });
    });

  return Object.entries(cityMap)
    .map(([city, { zach, arianne }]) => ({
      city,
      zachDays: zach.size,
      arianneDays: arianne.size,
      totalDays: new Set([...zach, ...arianne]).size,
    }))
    .filter(s => s.totalDays > 0)
    .sort((a, b) => b.totalDays - a.totalDays);
}

// ── City summary infographic ───────────────────────────────────────────────────

function CitySummary({ events, upcomingDays }) {
  const summary = useMemo(
    () => buildCitySummary(events, upcomingDays),
    [events, upcomingDays]
  );

  if (summary.length === 0) return null;

  const totalUpcoming = upcomingDays.length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Where you'll be · next 4 months
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {summary.map(({ city, zachDays, arianneDays, totalDays }) => {
          const zachPct   = Math.round((zachDays   / totalUpcoming) * 100);
          const ariannePct = Math.round((arianneDays / totalUpcoming) * 100);
          const isBoth = zachDays > 0 && arianneDays > 0;

          return (
            <div
              key={city}
              className="flex-shrink-0 min-w-[130px] bg-gray-50/80 border border-gray-100 rounded-xl px-3 py-3"
            >
              {/* City name */}
              <p className="text-sm font-bold text-gray-800 mb-2.5 truncate">{city}</p>

              {/* Two-tone bar */}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2.5 flex">
                {zachDays > 0 && (
                  <div
                    className="h-full bg-cyan-400 rounded-l-full"
                    style={{ width: `${zachPct}%` }}
                  />
                )}
                {arianneDays > 0 && (
                  <div
                    className={`h-full bg-purple-400 ${!zachDays ? 'rounded-full' : 'rounded-r-full'}`}
                    style={{ width: `${ariannePct}%` }}
                  />
                )}
              </div>

              {/* Person breakdown */}
              <div className="flex flex-col gap-1">
                {zachDays > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{zachDays}d</span> Zach
                    </span>
                  </div>
                )}
                {arianneDays > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{arianneDays}d</span> Arianne
                    </span>
                  </div>
                )}
                {isBoth && (
                  <div className="flex items-center gap-1.5 mt-0.5 pt-1.5 border-t border-gray-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {Math.min(zachDays, arianneDays)}d
                      </span> together
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Location label (in person column) ─────────────────────────────────────────

function LocationLabel({ event, person }) {
  const dotColor = person === 'zach' ? 'bg-cyan-400' : 'bg-purple-400';
  return (
    <div className="flex items-start gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${dotColor}`} />
        <span className="text-sm font-semibold text-gray-800 leading-tight">{event.city}</span>
      </div>
      {event.hasKids && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 leading-tight">
          👧 Kids
        </span>
      )}
    </div>
  );
}

// ── Travel column chips ────────────────────────────────────────────────────────

const PERSON_COLOR = {
  zach:    'text-cyan-600',
  arianne: 'text-purple-600',
};

function FlightDetail({ event }) {
  const personLabel = event.person === 'zach' ? 'Zach' : event.person === 'arianne' ? 'Arianne' : null;
  return (
    <div className="flex flex-col gap-0.5 pb-1.5 mb-1.5 border-b border-gray-100 last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        {event.needsBooking && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
            <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
            Needs booking
          </span>
        )}
        {personLabel && (
          <span className={`text-[10px] font-bold uppercase tracking-wide ${PERSON_COLOR[event.person]}`}>
            {personLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs">✈</span>
        <span className="text-xs font-semibold text-gray-800">{event.flightNumber}</span>
        {event.fromCity && event.toCity && (
          <span className="text-xs text-gray-500">{event.fromCity} → {event.toCity}</span>
        )}
      </div>
      {(event.departureTime || event.arrivalTime) && (
        <p className="text-[10px] text-gray-400 leading-none">
          {event.departureTime}{event.departureTime && event.arrivalTime ? ' – ' : ''}{event.arrivalTime}
        </p>
      )}
    </div>
  );
}

function HotelDetail({ event, dateStr }) {
  const personLabel = event.person === 'zach' ? 'Zach' : event.person === 'arianne' ? 'Arianne' : null;
  const isCheckIn  = event.dateFrom === dateStr;
  const isCheckOut = event.dateTo   === dateStr;
  return (
    <div className="flex flex-col gap-0.5 pb-1.5 mb-1.5 border-b border-gray-100 last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        {event.needsBooking && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
            <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
            Needs booking
          </span>
        )}
        {personLabel && (
          <span className={`text-[10px] font-bold uppercase tracking-wide ${PERSON_COLOR[event.person]}`}>
            {personLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs">🏨</span>
        <span className="text-xs font-semibold text-gray-800">{event.hotelName || event.city}</span>
        {event.hotelName && <span className="text-xs text-gray-400">{event.city}</span>}
      </div>
      <p className="text-[10px] text-gray-400 leading-none">
        {isCheckIn && isCheckOut
          ? 'Same-day'
          : isCheckIn
          ? `Check-in · out ${event.dateTo}`
          : `Check-out · in ${event.dateFrom}`}
      </p>
    </div>
  );
}

function TravelDetails({ events, dateStr }) {
  if (events.length === 0) return null;
  return (
    <div className="flex flex-col">
      {events.map((ev, i) => {
        if (ev.type === 'flight') return <FlightDetail key={i} event={ev} />;
        if (ev.type === 'hotel')  return <HotelDetail  key={i} event={ev} dateStr={dateStr} />;
        return null;
      })}
    </div>
  );
}

// ── Person column ──────────────────────────────────────────────────────────────

function PersonEvents({ events, person }) {
  const locationEvents = events.filter(e => e.type === 'location');
  if (locationEvents.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {locationEvents.map((ev, i) => (
        <LocationLabel key={i} event={ev} person={person} />
      ))}
    </div>
  );
}

// ── Day row ───────────────────────────────────────────────────────────────────

function DayRow({ dateStr, events, onDayClick, onAddEntry, isReadOnly }) {
  const today         = isDateToday(dateStr);
  const together      = getTogetherOnDate(events, dateStr);
  const zachEvents    = getEventsForPersonOnDate(events, 'zach',    dateStr);
  const arianneEvents = getEventsForPersonOnDate(events, 'arianne', dateStr);
  const travelEvents  = getTravelEventsForDate(events, dateStr);
  const notes         = getNotesForDate(events, dateStr);

  const hasContent = zachEvents.length > 0 || arianneEvents.length > 0
    || travelEvents.length > 0 || notes.length > 0 || together;

  const date    = parseISO(dateStr);
  const dayName = format(date, 'EEE');
  const dayNum  = format(date, 'MMM d');
  const weekend = isWeekend(date);

  if (!hasContent) {
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
        <div className="w-52 flex-shrink-0 h-9 border-l border-gray-50" />
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
          : 'border-gray-100 bg-white hover:bg-gray-50/40'
      }`}
      onClick={() => onDayClick?.(dateStr)}
    >
      <div className="flex">
        {/* Date */}
        <div className={`w-24 flex-shrink-0 px-4 py-3.5 flex flex-col justify-start ${today ? 'bg-indigo-50/30' : ''}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${
            today ? 'text-indigo-500' : 'text-gray-400'
          }`}>{today ? 'Today' : dayName}</span>
          <span className={`text-sm font-bold leading-tight mt-0.5 ${
            today ? 'text-indigo-700' : 'text-gray-800'
          }`}>{dayNum}</span>
          {together && <span className="text-sm mt-1.5" title="Together">💚</span>}
        </div>

        {/* Zach */}
        <div className="flex-1 px-3 py-3.5 border-l border-cyan-100/60 bg-cyan-50/10 min-h-[56px]">
          <PersonEvents events={zachEvents} person="zach" />
        </div>

        {/* Arianne */}
        <div className="flex-1 px-3 py-3.5 border-l border-purple-100/60 bg-purple-50/10 min-h-[56px]">
          <PersonEvents events={arianneEvents} person="arianne" />
        </div>

        {/* Travel */}
        <div className="w-52 flex-shrink-0 px-3 py-3.5 border-l border-gray-100 bg-white min-h-[56px]">
          <TravelDetails events={travelEvents} dateStr={dateStr} />
        </div>

        {/* Add */}
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

      {/* Notes */}
      {notes.length > 0 && (
        <div className="border-t border-amber-100 bg-amber-50/50 px-4 py-2 flex flex-col gap-1">
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
      <div className="w-52 flex-shrink-0 px-3 py-2.5 border-l border-gray-100">
        <span className="text-xs font-semibold text-gray-400 tracking-wide">Travel</span>
      </div>
      {!isReadOnly && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}

// ── Day builders ──────────────────────────────────────────────────────────────

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
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
      {/* City summary — only in upcoming mode */}
      {!showArchive && (
        <CitySummary events={events} upcomingDays={upcomingDays} />
      )}

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

      {/* Calendar table */}
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
