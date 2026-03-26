import { useState } from 'react';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { DayDetailModal } from './DayDetailModal';
import { VIEW_MODES } from '../../constants';

export function CalendarView({ events, onAddEvent, onEditEvent, onDeleteEvent, isReadOnly }) {
  const [viewMode, setViewMode] = useState(VIEW_MODES.WEEK);
  const [dayDetailDate, setDayDetailDate] = useState(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);

  function handleDayClick(dateStr) {
    setDayDetailDate(dateStr);
    setDayDetailOpen(true);
  }

  function handleAddEntry(dateStr) {
    onAddEvent?.(dateStr);
  }

  function handleEditFromDetail(event) {
    setDayDetailOpen(false);
    onEditEvent?.(event);
  }

  function handleDeleteFromDetail(id) {
    onDeleteEvent?.(id);
    // Keep modal open so user can see remaining events
  }

  if (!events) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 py-24">
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div>
      {/* View mode toggle */}
      <div className="max-w-5xl mx-auto px-4 pt-4 flex justify-end">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setViewMode(VIEW_MODES.WEEK)}
            className={`px-3 py-1.5 font-medium transition-colors cursor-pointer ${
              viewMode === VIEW_MODES.WEEK
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode(VIEW_MODES.MONTH)}
            className={`px-3 py-1.5 font-medium transition-colors cursor-pointer ${
              viewMode === VIEW_MODES.MONTH
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {viewMode === VIEW_MODES.WEEK ? (
        <WeekView
          events={events}
          onAddEntry={handleAddEntry}
          isReadOnly={isReadOnly}
          onDayClick={handleDayClick}
        />
      ) : (
        <MonthView
          events={events}
          onAddEntry={handleAddEntry}
          isReadOnly={isReadOnly}
          onDayClick={handleDayClick}
        />
      )}

      <DayDetailModal
        isOpen={dayDetailOpen}
        onClose={() => setDayDetailOpen(false)}
        dateStr={dayDetailDate}
        events={events}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
        onAdd={handleAddEntry}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
