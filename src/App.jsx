import { useState, useRef, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { CalendarView } from './components/calendar/CalendarView';
import { EventModal } from './components/forms/EventModal';
import { ImportModal } from './components/forms/ImportModal';
import { BookingsPanel } from './components/layout/BookingsPanel';
import { useEvents } from './hooks/useEvents';

const isReadOnly = new URLSearchParams(window.location.search).get('mode') === 'view';

// ── Pull-to-refresh ────────────────────────────────────────────────────────────
function PullToRefresh() {
  const [display, setDisplay] = useState({ y: 0, refreshing: false });
  const ref = useRef({ startY: 0, pullY: 0 });
  const THRESHOLD = 72;

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY === 0) ref.current.startY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      const { startY } = ref.current;
      if (window.scrollY === 0 && startY > 0) {
        const dy = Math.max(0, e.touches[0].clientY - startY);
        ref.current.pullY = Math.min(dy, THRESHOLD + 24);
        setDisplay({ y: ref.current.pullY, refreshing: false });
      }
    };
    const onTouchEnd = () => {
      if (ref.current.pullY >= THRESHOLD) {
        setDisplay({ y: THRESHOLD, refreshing: true });
        setTimeout(() => window.location.reload(), 350);
      } else {
        ref.current.pullY = 0;
        ref.current.startY = 0;
        setDisplay({ y: 0, refreshing: false });
      }
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove',  onTouchMove,  { passive: true });
    document.addEventListener('touchend',   onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove',  onTouchMove);
      document.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  if (display.y === 0) return null;
  const progress = Math.min(display.y / THRESHOLD, 1);

  return (
    <div
      className="fixed left-0 right-0 z-50 flex items-end justify-center bg-white/90 backdrop-blur-sm pointer-events-none"
      style={{ top: 0, height: display.y, paddingBottom: 10, paddingTop: 'env(safe-area-inset-top)' }}
    >
      <svg
        className={`w-5 h-5 text-indigo-500 ${display.refreshing ? 'animate-spin' : ''}`}
        style={{ opacity: progress, transform: `rotate(${progress * 360}deg)` }}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </div>
  );
}

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
      <PullToRefresh />
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
