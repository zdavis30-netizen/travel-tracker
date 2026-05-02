import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

function fmt(dateStr) {
  try { return format(parseISO(dateStr), 'MMM d, yyyy'); } catch { return dateStr; }
}

function PersonDot({ person }) {
  return (
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
      person === 'zach' ? 'bg-cyan-400' : 'bg-purple-400'
    }`} />
  );
}

function SectionHeader({ icon, title, count }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
      <span>{icon}</span>
      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</span>
      <span className="ml-auto text-xs font-semibold text-gray-400">{count}</span>
    </div>
  );
}

function FlightRow({ event, onEdit }) {
  const personLabel = event.person === 'zach' ? 'Zach' : 'Arianne';
  return (
    <button
      onClick={() => onEdit?.(event)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 cursor-pointer"
    >
      <PersonDot person={event.person} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-800">{event.flightNumber}</span>
          {event.fromCode && event.toCode && (
            <span className="text-xs text-gray-400">{event.fromCode} → {event.toCode}</span>
          )}
        </div>
        <p className="text-[11px] text-gray-400">{personLabel} · {fmt(event.date)}</p>
      </div>
      {event.departureTime && (
        <span className="text-[11px] text-gray-500 flex-shrink-0">{event.departureTime}</span>
      )}
      {event.needsBooking && (
        <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-100 rounded-full px-1.5 py-0.5 flex-shrink-0">Book</span>
      )}
    </button>
  );
}

function HotelRow({ event, onEdit }) {
  const personLabel = event.person === 'zach' ? 'Zach' : 'Arianne';
  return (
    <button
      onClick={() => onEdit?.(event)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 cursor-pointer"
    >
      <PersonDot person={event.person} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-800 truncate">{event.hotelName || event.city}</p>
        <p className="text-[11px] text-gray-400">
          {personLabel} · {fmt(event.dateFrom)} – {fmt(event.dateTo)}
        </p>
      </div>
      {event.needsBooking && (
        <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-100 rounded-full px-1.5 py-0.5 flex-shrink-0">Book</span>
      )}
    </button>
  );
}

export function BookingsPanel({ events, isOpen, onClose, onEditEvent }) {
  const todayStr = today();

  const { flights, hotels, needsBooking } = useMemo(() => {
    const future = events.filter(e =>
      (e.type === 'flight' && (e.date || '') >= todayStr) ||
      (e.type === 'hotel'  && (e.dateFrom || '') >= todayStr)
    );

    const flights = future
      .filter(e => e.type === 'flight' && !e.needsBooking)
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    const hotels = future
      .filter(e => e.type === 'hotel' && !e.needsBooking)
      .sort((a, b) => (a.dateFrom < b.dateFrom ? -1 : 1));

    const needsBooking = future
      .filter(e => e.needsBooking)
      .sort((a, b) => {
        const da = a.type === 'flight' ? a.date : a.dateFrom;
        const db = b.type === 'flight' ? b.date : b.dateFrom;
        return da < db ? -1 : 1;
      });

    return { flights, hotels, needsBooking };
  }, [events, todayStr]);

  if (!isOpen) return null;

  const total = flights.length + hotels.length + needsBooking.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Bookings</h2>
            <p className="text-xs text-gray-400">{total} upcoming item{total !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer transition-colors"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {total === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-3xl mb-2">✈️</span>
              <p className="text-sm">No upcoming bookings</p>
            </div>
          )}

          {/* Needs booking */}
          {needsBooking.length > 0 && (
            <div>
              <SectionHeader icon="⚠️" title="Needs Booking" count={needsBooking.length} />
              {needsBooking.map((ev, i) =>
                ev.type === 'flight'
                  ? <FlightRow key={i} event={ev} onEdit={onEditEvent} />
                  : <HotelRow  key={i} event={ev} onEdit={onEditEvent} />
              )}
            </div>
          )}

          {/* Upcoming flights */}
          {flights.length > 0 && (
            <div>
              <SectionHeader icon="✈️" title="Flights" count={flights.length} />
              {flights.map((ev, i) => (
                <FlightRow key={i} event={ev} onEdit={onEditEvent} />
              ))}
            </div>
          )}

          {/* Upcoming hotels */}
          {hotels.length > 0 && (
            <div>
              <SectionHeader icon="🏨" title="Hotels" count={hotels.length} />
              {hotels.map((ev, i) => (
                <HotelRow key={i} event={ev} onEdit={onEditEvent} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
