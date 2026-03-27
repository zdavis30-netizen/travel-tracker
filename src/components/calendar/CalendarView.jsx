import { useState } from 'react';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { ListView } from './ListView';
import { DayDetailModal } from './DayDetailModal';

const VIEWS = [
  { key: 'list',  label: 'List' },
  { key: 'week',  label: 'Week' },
  { key: 'month', label: 'Month' },
];

export function CalendarView({ events, onAddEvent, onEditEvent, onDeleteEvent, onSaveEvent, isReadOnly }) {
  const [viewMode, setViewMode] = useState('list');
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
  }

  if (!events) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div>
      {/* View toggle — sits just below the header */}
      <div className="max-w-5xl mx-auto px-5 pt-4 pb-1 flex items-center justify-between">
        {/* Segmented control */}
        <div className="inline-flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm gap-0.5">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                viewMode === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'week' && (
        <WeekView
          events={events}
          onAddEntry={handleAddEntry}
          isReadOnly={isReadOnly}
          onDayClick={handleDayClick}
        />
      )}
      {viewMode === 'month' && (
        <MonthView
          events={events}
          onAddEntry={handleAddEntry}
          isReadOnly={isReadOnly}
          onDayClick={handleDayClick}
        />
      )}
      {viewMode === 'list' && (
        <ListView
          events={events}
          onDayClick={handleDayClick}
          onAddEntry={handleAddEntry}
          onSaveEvent={onSaveEvent}
          onEditEvent={onEditEvent}
          isReadOnly={isReadOnly}
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
        onSave={onSaveEvent}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
