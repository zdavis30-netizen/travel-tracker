import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getEventsForPersonOnDate, getTogetherOnDate, getNotesForDate } from '../../utils/eventUtils';

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

function NotesSection({ notes, dateStr, onEdit, onDelete, onAddNote, isReadOnly }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  function handleAdd() {
    if (!newText.trim()) return;
    onAddNote({ type: 'note', date: dateStr, text: newText.trim() });
    setNewText('');
    setIsAdding(false);
  }

  function handleEditSave(note) {
    if (!editText.trim()) return;
    onEdit({ ...note, text: editText.trim() });
    setEditingId(null);
  }

  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
          <span>📝</span> Notes
        </h3>
        {!isReadOnly && !isAdding && (
          <button
            onClick={() => { setIsAdding(true); setNewText(''); }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
          >
            + Add note
          </button>
        )}
      </div>

      {/* Existing notes */}
      <div className="space-y-2">
        {notes.map(note => (
          <div key={note.id} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {editingId === note.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={3}
                  autoFocus
                  className="w-full text-sm border border-amber-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-white"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleEditSave(note)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-700 leading-snug flex-1">{note.text}</p>
                {!isReadOnly && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { setEditingId(note.id); setEditText(note.text); }} className="text-xs text-gray-400 hover:text-indigo-600 cursor-pointer">Edit</button>
                    <button onClick={() => onDelete(note.id)} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer">Delete</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {notes.length === 0 && !isAdding && (
          <p className="text-xs text-gray-400 italic">No notes for this day</p>
        )}
      </div>

      {/* Add new note inline */}
      {isAdding && (
        <div className="mt-2 space-y-2">
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Type a note for this day…"
            rows={3}
            autoFocus
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full cursor-pointer transition-colors">Save</button>
            <button onClick={() => { setIsAdding(false); setNewText(''); }} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 cursor-pointer">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DayDetailModal({ isOpen, onClose, dateStr, events, onEdit, onDelete, onAdd, onSave, isReadOnly }) {
  if (!dateStr) return null;

  const zachEvents = getEventsForPersonOnDate(events, 'zach', dateStr);
  const arianneEvents = getEventsForPersonOnDate(events, 'arianne', dateStr);
  const isTogether = getTogetherOnDate(events, dateStr);
  const notes = getNotesForDate(events, dateStr);

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

        {/* Notes section */}
        <NotesSection
          notes={notes}
          dateStr={dateStr}
          onEdit={ev => onEdit?.(ev)}
          onDelete={id => onDelete?.(id)}
          onAddNote={note => onSave?.(note)}
          isReadOnly={isReadOnly}
        />
      </div>
    </Modal>
  );
}
