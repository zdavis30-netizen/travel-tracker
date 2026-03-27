import { useState } from 'react';
import { ListView } from './ListView';
import { DayDetailModal } from './DayDetailModal';

export function CalendarView({ events, onAddEvent, onEditEvent, onDeleteEvent, onSaveEvent, isReadOnly }) {
  const [dayDetailDate, setDayDetailDate] = useState(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);

  function handleDayClick(dateStr) {
    setDayDetailDate(dateStr);
    setDayDetailOpen(true);
  }

  function handleAddEntry(dateStr, defaultType) {
    onAddEvent?.(dateStr, null, defaultType);
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
      <ListView
        events={events}
        onDayClick={handleDayClick}
        onAddEntry={handleAddEntry}
        onSaveEvent={onSaveEvent}
        onEditEvent={onEditEvent}
        onDeleteEvent={onDeleteEvent}
        isReadOnly={isReadOnly}
      />

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
