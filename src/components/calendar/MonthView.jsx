import { useState } from 'react';
import {
  getCurrentMonth,
  navigateMonth,
  formatMonthYearLabel,
  getMonthWeeks,
  isCurrentMonth,
  isDateToday,
  formatDayNumber,
} from '../../utils/dateUtils';
import { getEventsForPersonOnDate, getTogetherOnDate } from '../../utils/eventUtils';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MiniChip({ color, label }) {
  return (
    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium leading-tight truncate max-w-full ${color}`}>
      {label}
    </span>
  );
}

function DayCell({ dateStr, events, month, isReadOnly, onDayClick, onAddEntry }) {
  const inMonth  = isCurrentMonth(dateStr, month);
  const today    = isDateToday(dateStr);

  const zachEvents    = getEventsForPersonOnDate(events, 'zach',    dateStr);
  const arianneEvents = getEventsForPersonOnDate(events, 'arianne', dateStr);
  const isTogether    = getTogetherOnDate(events, dateStr);

  const zachLocation    = zachEvents.find(e => e.type === 'location');
  const zachHotel       = zachEvents.find(e => e.type === 'hotel');
  const arianneLocation = arianneEvents.find(e => e.type === 'location');
  const arianneHotel    = arianneEvents.find(e => e.type === 'hotel');
  const flightCount = [...zachEvents, ...arianneEvents].filter(e => e.type === 'flight').length;
  const hasKids = zachEvents.some(e => e.type === 'location' && e.hasKids) ||
                  arianneEvents.some(e => e.type === 'location' && e.hasKids);

  const zachLabel    = zachHotel    ? `🏨 ${zachHotel.city}`    : zachLocation    ? `📍 ${zachLocation.city}`    : null;
  const arianneLabel = arianneHotel ? `🏨 ${arianneHotel.city}` : arianneLocation ? `📍 ${arianneLocation.city}` : null;

  return (
    <div
      className={`min-h-[80px] p-1.5 border border-gray-50 cursor-pointer relative group transition-colors ${
        inMonth ? 'bg-white hover:bg-gray-50/60' : 'bg-gray-50/40 hover:bg-gray-50'
      } ${today ? 'ring-2 ring-inset ring-indigo-300' : ''}`}
      onClick={() => onDayClick?.(dateStr)}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full leading-none ${
          today    ? 'bg-indigo-600 text-white' :
          inMonth  ? 'text-gray-700' :
                     'text-gray-300'
        }`}>
          {formatDayNumber(dateStr)}
        </span>
        {!isReadOnly && (
          <button
            onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr); }}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-indigo-500 text-sm leading-none cursor-pointer transition-opacity"
            title="Add event"
          >+</button>
        )}
      </div>

      {/* Mini chips */}
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {zachLabel    && <MiniChip color="bg-cyan-50 text-cyan-700"     label={zachLabel}    />}
        {arianneLabel && <MiniChip color="bg-purple-50 text-purple-700" label={arianneLabel} />}
        <div className="flex items-center gap-1 flex-wrap mt-0.5">
          {flightCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-sky-600 font-medium">
              ✈ {flightCount > 1 ? flightCount : ''}
            </span>
          )}
          {isTogether && <span title="Together" className="text-xs">💚</span>}
          {hasKids    && <span title="Kids"     className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
        </div>
      </div>
    </div>
  );
}

export function MonthView({ events, onAddEntry, isReadOnly, onDayClick }) {
  const [month, setMonth] = useState(() => getCurrentMonth());
  const weeks = getMonthWeeks(month);

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Navigation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between mb-4">
        <button
          onClick={() => setMonth(m => navigateMonth(m, -1))}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Previous month"
        >←</button>
        <span className="text-sm font-semibold text-gray-800">{formatMonthYearLabel(month)}</span>
        <button
          onClick={() => setMonth(m => navigateMonth(m, 1))}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Next month"
        >→</button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Day name headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_NAMES.map(name => (
            <div key={name} className="px-2 py-2 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              {name}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-gray-50 last:border-b-0">
            {week.map(dateStr => (
              <DayCell
                key={dateStr}
                dateStr={dateStr}
                events={events}
                month={month}
                isReadOnly={isReadOnly}
                onDayClick={onDayClick}
                onAddEntry={onAddEntry}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-cyan-200 inline-block" /> Zach
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-purple-200 inline-block" /> Arianne
        </span>
        <span className="flex items-center gap-1.5">✈ Flight</span>
        <span className="flex items-center gap-1.5">💚 Together</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" /> Kids
        </span>
      </div>
    </div>
  );
}
