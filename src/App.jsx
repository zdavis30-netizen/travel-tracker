import { useState } from 'react';
import { Header } from './components/layout/Header';
import { CalendarView } from './components/calendar/CalendarView';
import { EventModal } from './components/forms/EventModal';
import { ImportModal } from './components/forms/ImportModal';
import { BookingsPanel } from './components/layout/BookingsPanel';
import { useEvents } from './hooks/useEvents';

const isReadOnly = new URLSearchParams(window.location.search).get('mode') === 'view';

function App() {
  const { events, addEvent, updateEvent, deleteEvent, isLive } = useEvents();
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [defaultType, setDefaultType] = useState(null);

  function handleAddEvent(dateStr, editEventOverride, type) {
    if (editEventOverride) {
      setEditEvent(editEventOverride);
    } else {
      setEditEvent(null);
    }
    setDefaultDate(dateStr || null);
    setDefaultType(type || null);
    setModalOpen(true);
  }

  function handleEditEvent(event) {
    setEditEvent(event);
    setModalOpen(true);
  }

  function handleSave(data) {
    if (data.id) {
      updateEvent(data.id, data);
    } else {
      addEvent(data);
    }
  }

  function isDuplicate(a, b) {
    if (a.type !== b.type) return false;
    if (a.type === 'location' || a.type === 'hotel') {
      return a.person === b.person && a.city === b.city && a.dateFrom === b.dateFrom && a.dateTo === b.dateTo;
    }
    if (a.type === 'flight') {
      return a.person === b.person && a.flightNumber === b.flightNumber && a.date === b.date;
    }
    if (a.type === 'together') {
      return a.dateFrom === b.dateFrom && a.dateTo === b.dateTo;
    }
    return false;
  }

  function handleImportEvents(newEvents) {
    const deduped = newEvents.filter(newEv => !events.some(existing => isDuplicate(existing, newEv)));
    deduped.forEach(e => addEvent(e));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onAddEvent={isReadOnly ? undefined : handleAddEvent}
        onImport={isReadOnly ? undefined : () => setImportOpen(true)}
        onOpenBookings={() => setBookingsOpen(true)}
        isLive={isLive}
        isReadOnly={isReadOnly}
      />

      <main className="pb-16">
        <CalendarView
          events={events}
          onAddEvent={handleAddEvent}
          onEditEvent={handleEditEvent}
          onDeleteEvent={deleteEvent}
          onSaveEvent={handleSave}
          isReadOnly={isReadOnly}
        />
      </main>

      <BookingsPanel
        events={events}
        isOpen={bookingsOpen}
        onClose={() => setBookingsOpen(false)}
        onEditEvent={handleEditEvent}
      />

      {!isReadOnly && (
        <>
          <EventModal
            key={editEvent?.id || 'new'}
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            onDelete={deleteEvent}
            editEvent={editEvent}
            defaultDate={defaultDate}
            defaultType={defaultType}
          />

          <ImportModal
            isOpen={importOpen}
            onClose={() => setImportOpen(false)}
            onImport={handleImportEvents}
          />
        </>
      )}
    </div>
  );
}

export default App;
