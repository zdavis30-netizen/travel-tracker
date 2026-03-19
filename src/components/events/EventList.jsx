import { useState } from 'react';
import { EventCard } from './EventCard';
import { PEOPLE, PERSON_LABELS, EVENT_TYPES } from '../../constants';

export function EventList({ events, onEdit, onDelete }) {
  const [filterPerson, setFilterPerson] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filtered = events.filter(e => {
    if (filterPerson !== 'all' && e.person !== filterPerson) return false;
    if (filterType !== 'all' && e.type !== filterType) return false;
    return true;
  });

  // Sort by date (descending)
  const sorted = [...filtered].sort((a, b) => {
    const da = a.date || a.dateFrom;
    const db = b.date || b.dateFrom;
    return da < db ? 1 : da > db ? -1 : 0;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-gray-500 font-medium">Filter:</span>
        <div className="flex gap-1">
          <button
            onClick={() => setFilterPerson('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${filterPerson === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Everyone
          </button>
          {PEOPLE.map(p => (
            <button
              key={p}
              onClick={() => setFilterPerson(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${filterPerson === p ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {PERSON_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All Types
          </button>
          {Object.values(EVENT_TYPES).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${filterType === t ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t === 'location' ? '📍' : t === 'flight' ? '✈' : '🏨'} {t}
            </button>
          ))}
        </div>
      </div>

      {/* Event count */}
      <p className="text-xs text-gray-400">{sorted.length} event{sorted.length !== 1 ? 's' : ''}</p>

      {/* Events */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="font-medium text-gray-500">No events yet</p>
          <p className="text-sm mt-1">Use the "Add Event" button to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(event => (
            <EventCard key={event.id} event={event} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
