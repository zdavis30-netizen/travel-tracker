import { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PERSON_LABELS } from '../../constants';

function formatEventSummary(event) {
  if (event.type === 'location') {
    return `${event.city} · ${event.dateFrom} – ${event.dateTo}`;
  }
  if (event.type === 'flight') {
    const route = [event.fromCity || event.fromCode, event.toCity || event.toCode].filter(Boolean).join(' → ');
    return `${event.flightNumber}${route ? ` · ${route}` : ''} · ${event.date}`;
  }
  if (event.type === 'hotel') {
    return `${event.city}${event.hotelName ? ` · ${event.hotelName}` : ''} · ${event.dateFrom} – ${event.dateTo}`;
  }
  return '';
}

const TYPE_ICONS = { location: '📍', flight: '✈', hotel: '🏨' };

export function EventCard({ event, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge type={event.type}>
            {TYPE_ICONS[event.type]} {event.type}
          </Badge>
          <span className="text-xs text-gray-500 font-medium">
            {PERSON_LABELS[event.person]}
          </span>
        </div>
        <p className="text-sm text-gray-800 mt-1 font-medium truncate">
          {formatEventSummary(event)}
        </p>
        {event.type === 'flight' && (event.departureTime || event.arrivalTime) && (
          <p className="text-xs text-gray-500 mt-0.5">
            {event.departureTime && `Departs: ${event.departureTime}`}
            {event.departureTime && event.arrivalTime && ' · '}
            {event.arrivalTime && `Arrives: ${event.arrivalTime}`}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {confirmDelete ? (
          <>
            <span className="text-xs text-red-600 font-medium">Delete?</span>
            <Button size="sm" variant="danger" onClick={() => onDelete(event.id)}>Yes</Button>
            <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>No</Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={() => onEdit(event)}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
