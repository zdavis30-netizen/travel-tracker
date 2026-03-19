import { PersonCell } from './PersonCell';
import { formatDayLabel, isDateToday } from '../../utils/dateUtils';

export function DayRow({ date, zachEvents, arianneEvents }) {
  const today = isDateToday(date);

  return (
    <div className={`flex border-b border-gray-100 ${today ? 'bg-indigo-50/40' : 'bg-white hover:bg-gray-50/50'} transition-colors`}>
      {/* Date label */}
      <div className={`w-28 flex-shrink-0 py-2 px-3 flex flex-col justify-center ${today ? '' : ''}`}>
        {today && (
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-0.5">Today</span>
        )}
        <span className={`text-sm font-medium ${today ? 'text-indigo-700' : 'text-gray-700'}`}>
          {formatDayLabel(date)}
        </span>
      </div>

      {/* Zach */}
      <PersonCell person="zach" events={zachEvents} />

      {/* Arianne */}
      <PersonCell person="arianne" events={arianneEvents} />
    </div>
  );
}
