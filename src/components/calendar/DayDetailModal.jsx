import { format, parseISO } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getEventsForPersonOnDate, getTogetherOnDate } from '../../utils/eventUtils';

function formatFullDate(dateStr) {
  return format(parseISO(dateStr), 'EEEE, MMMM d');
}

function EventDetail({ event, onEdit, onDelete, isReadOnly }) {
  function renderContent() {
    if (event.type === 'location') {
      return (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">📍</span>
            <span className="font-semibold text-gray-800">{event.city}</span>
            {event.hasKids && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                👧 Kids
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {event.dateFrom} &ndash; {event.dateTo}
          </p>
        </div>
      );
    }

    if (event.type === 'flight') {
      return (
        <div>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-sm">✈</span>
            <span className={`font-semibold text-gray-800 ${event.needsBooking ? 'font-bold' : ''}`}>
              {event.flightNumber}
            </span>
            {event.needsBooking && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700 border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                Needs Booking
              </span>
            )}
          </div>
          {(event.fromCity || event.toCity) && (
            <p className="text-xs text-gray-600">
              {event.fromCity}{event.fromCode ? ` (${event.fromCode})` : ''} &rarr; {event.toCity}{event.toCode ? ` (${event.toCode})` : ''}
            </p>
          )}
          {(event.departureTime || event.arrivalTime) && (
            <p className="text-xs text-gray-500">
              {event.departureTime} &ndash; {event.arrivalTime}
            </p>
          )}
          <p className="text-xs text-gray-500">{event.date}</p>
        </div>
      );
    }

    if (event.type === 'hotel') {
      return (
        <div>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-sm">🏨</span>
            <span className={`font-semibold text-gray-800 ${event.needsBooking ? 'font-bold' : ''}`}>
              {event.hotelName || event.city}
            </span>
            {event.needsBooking && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700 border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                Needs Booking
              </span>
            )}
          </div>
          {event.hotelName && (
            <p className="text-xs text-gray-600">{event.city}</p>
          )}
          <p className="text-xs text-gray-500">
            Check-in: {event.dateFrom} &ndash; Check-out: {event.dateTo}
          </p>
        </div>
      );
    }

    return null;
  }

  const bgMap = {
    location: 'bg-blue-50 border-blue-200',
    flight: 'bg-amber-50 border-amber-200',
    hotel: 'bg-emerald-50 border-emerald-200',
  };

  return (
    <div className={`flex items-start justify-between gap-2 p-3 rounded-lg border ${bgMap[event.type] || 'bg-gray-50 border-gray-200'}`}>
      <div className="flex-1 min-w-0">{renderContent()}</div>
      {!isReadOnly && (
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(event)}
            className="text-xs text-gray-500 hover:text-indigo-600 px-1.5 py-1 rounded hover:bg-white transition-colors cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="text-xs text-gray-500 hover:text-red-600 px-1.5 py-1 rounded hover:bg-white transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function PersonSection({ label, colorClass, events, onEdit, onDelete, isReadOnly }) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className={`text-sm font-semibold mb-2 ${colorClass}`}>{label}</h3>
      {events.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Nothing planned</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map(ev => (
            <EventDetail
              key={ev.id || `${ev.type}-${ev.dateFrom || ev.date}`}
              event={ev}
              onEdit={onEdit}
              onDelete={onDelete}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DayDetailModal({ isOpen, onClose, dateStr, events, onEdit, onDelete, onAdd, isReadOnly }) {
  if (!dateStr) return null;

  const zachEvents = getEventsForPersonOnDate(events, 'zach', dateStr);
  const arianneEvents = getEventsForPersonOnDate(events, 'arianne', dateStr);
  const isTogether = getTogetherOnDate(events, dateStr);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={formatFullDate(dateStr)}>
      <div className="space-y-4">
        {/* Together banner */}
        {isTogether && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 border border-green-200 text-green-800 text-sm font-medium">
            <span>💚</span>
            <span>Together</span>
          </div>
        )}

        {/* Add button */}
        {!isReadOnly && (
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { onAdd?.(dateStr); onClose(); }}>
              + Add Entry
            </Button>
          </div>
        )}

        {/* Person sections */}
        <div className="flex flex-col sm:flex-row gap-4">
          <PersonSection
            label="Zach"
            colorClass="text-indigo-700"
            events={zachEvents}
            onEdit={ev => { onEdit?.(ev); onClose(); }}
            onDelete={id => { onDelete?.(id); }}
            isReadOnly={isReadOnly}
          />
          <div className="hidden sm:block w-px bg-gray-200 self-stretch" />
          <PersonSection
            label="Arianne"
            colorClass="text-rose-700"
            events={arianneEvents}
            onEdit={ev => { onEdit?.(ev); onClose(); }}
            onDelete={id => { onDelete?.(id); }}
            isReadOnly={isReadOnly}
          />
        </div>
      </div>
    </Modal>
  );
}
