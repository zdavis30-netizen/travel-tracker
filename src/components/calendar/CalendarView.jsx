import { useMemo } from 'react';
import { DayRow } from './DayRow';
import { buildDayList, formatMonthLabel, isSameMonthAs } from '../../utils/dateUtils';
import { getEventsForPersonOnDate } from '../../utils/eventUtils';
import { PERSON_COLORS } from '../../constants';

export function CalendarView({ start, end, events }) {
  const days = useMemo(() => buildDayList(start, end), [start, end]);

  if (days.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 py-24">
        <p>No date range selected.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Column headers */}
        <div className="flex border-b-2 border-gray-200 bg-gray-50">
          <div className="w-28 flex-shrink-0 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Date
          </div>
          <div className={`flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wide border-l ${PERSON_COLORS.zach.border} ${PERSON_COLORS.zach.header} ${PERSON_COLORS.zach.headerText}`}>
            Zach
          </div>
          <div className={`flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wide border-l ${PERSON_COLORS.arianne.border} ${PERSON_COLORS.arianne.header} ${PERSON_COLORS.arianne.headerText}`}>
            Arianne
          </div>
        </div>

        {/* Day rows with month separators */}
        {days.map((date, i) => {
          const prev = days[i - 1] || null;
          const showMonth = !isSameMonthAs(date, prev);

          return (
            <div key={date}>
              {showMonth && (
                <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {formatMonthLabel(date)}
                  </span>
                </div>
              )}
              <DayRow
                date={date}
                zachEvents={getEventsForPersonOnDate(events, 'zach', date)}
                arianneEvents={getEventsForPersonOnDate(events, 'arianne', date)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
