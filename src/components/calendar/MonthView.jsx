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
    <span className={`inline-block text-xs px-1 py-0.5 rounded leading-tight truncate max-w-full ${color}`}>
      {label}
    </span>
  );
}

function DayCell({ dateStr, events, month, isReadOnly, onDayClick, onAddEntry }) {
  const inMonth = isCurrentMonth(dateStr, month);
  const today = isDateToday(dateStr);

  const zachEvents = getEventsForPersonOnDate(events, 'zach', dateStr);
  const arianneEvents = getEventsForPersonOnDate(events, 'arianne', dateStr);
  const isTogether = getTogetherOnDate(events, dateStr);

  // Compact summary values
  const zachLocation = zachEvents.find(e => e.type === 'location');
  const zachHotel = zachEvents.find(e => e.type === 'hotel');
  const arianneLocation = arianneEvents.find(e => e.type === 'location');
  const arianneHotel = arianneEvents.find(e => e.type === 'hotel');
  const flightCount = [...zachEvents, ...arianneEvents].filter(e => e.type === 'flight').length;
  const hasKids = zachEvents.some(e => e.type === 'location' && e.hasKids) ||
                  arianneEvents.some(e => e.type === 'location' && e.hasKids);

  const zachLabel = zachHotel ? `🏨 ${zachHotel.city}` : zachLocation ? `📍 ${zachLocation.city}` : null;
  const arianneLabel = arianneHotel ? `🏨 ${arianneHotel.city}` : arianneLocation ? `📍 ${arianneLocation.city}` : null;

  return (
    <div
      className={`min-h-[80px] p-1.5 border border-gray-100 cursor-pointer relative group transition-colors ${
        inMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
      } ${today ? 'ring-2 ring-inset ring-indigo-400' : ''}`}
      onClick={() => onDayClick?.(dateStr)}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full leading-none ${
            today
              ? 'bg-indigo-600 text-white'
              : inMonth
              ? 'text-gray-800'
              : 'text-gray-400'
          }`}
        >
          {formatDayNumber(dateStr)}
        </span>
        {!isReadOnly && (
          <button
            onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr); }}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-500 text-sm leading-none cursor-pointer transition-opacity"
            title="Add event"
          >
            +
          </button>
        )}
      </div>

      {/* Mini event indicators */}
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {zachLabel && (
          <MiniChip color="bg-blue-100 text-blue-700" label={zachLabel} />
        )}
        {arianneLabel && (
          <MiniChip color="bg-purple-100 text-purple-700" label={arianneLabel} />
        )}
        <div className="flex items-center gap-1 flex-wrap mt-0.5">
          {flightCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              {flightCount}✈
            </span>
          )}
          {isTogether && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" title="Together" />
          )}
          {hasKids && (
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" title="Kids" />
          )}
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
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonth(m => navigateMonth(m, -1))}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer text-sm"
          aria-label="Previous month"
        >
          ← Prev
        </button>
        <h2 className="text-base font-bold text-gray-800">
          {formatMonthYearLabel(month)}
        </h2>
        <button
          onClick={() => setMonth(m => navigateMonth(m, 1))}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer text-sm"
          aria-label="Next month"
        >
          Next →
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Day name headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAY_NAMES.map(name => (
            <div
              key={name}
              className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
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
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Zach location
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Arianne location
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Flight
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Together
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Kids
        </span>
      </div>
    </div>
  );
}
