import { useState } from 'react';
import { Header } from './components/layout/Header';
import { CalendarView } from './components/calendar/CalendarView';
import { EventList } from './components/events/EventList';
import { EventModal } from './components/forms/EventModal';
import { ImportModal } from './components/forms/ImportModal';
import { QuickAdd } from './components/ui/QuickAdd';
import { useEvents } from './hooks/useEvents';
import { useDateRange } from './hooks/useDateRange';

const isReadOnly = new URLSearchParams(window.location.search).get('mode') === 'view';

function App() {
  const { events, addEvent, updateEvent, deleteEvent, isLive } = useEvents();
  const { start, end, activePreset, setPreset, setCustomRange } = useDateRange(90);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [activeView, setActiveView] = useState('calendar');

  // dateStr is optional — when provided it pre-fills the date on the form (future enhancement)
  // editEventOverride is used when opening edit from DayDetailModal
  function handleAddEvent(dateStr, editEventOverride) {
    if (editEventOverride) {
      setEditEvent(editEventOverride);
    } else {
      setEditEvent(null);
    }
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

  // openModal=true when parsed event needs user review before saving
  function handleQuickAdd(event, openModal = false) {
    if (openModal) {
      setEditEvent({ ...event, id: null });
      setModalOpen(true);
    } else {
      addEvent(event);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header
        start={start}
        end={end}
        activePreset={activePreset}
        onPreset={setPreset}
        onCustomRange={setCustomRange}
        onAddEvent={isReadOnly ? undefined : handleAddEvent}
        onImport={isReadOnly ? undefined : () => setImportOpen(true)}
        activeView={activeView}
        onViewChange={setActiveView}
        isLive={isLive}
        isReadOnly={isReadOnly}
      />

      {!isReadOnly && <QuickAdd onAdd={handleQuickAdd} />}

      {isLive && (
        <div className="max-w-6xl mx-auto px-4">
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live — changes sync instantly for both of you
          </p>
        </div>
      )}

      <main className="pb-12">
        {activeView === 'calendar' ? (
          <CalendarView
            events={events}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
            onDeleteEvent={deleteEvent}
            onSaveEvent={handleSave}
            isReadOnly={isReadOnly}
          />
        ) : (
          <EventList
            events={events}
            onEdit={handleEditEvent}
            onDelete={deleteEvent}
          />
        )}
      </main>

      {!isReadOnly && (
        <>
          <EventModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            editEvent={editEvent}
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
