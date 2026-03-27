import { useState } from 'react';
import { format } from 'date-fns';

function today() {
  return format(new Date(), 'yyyy-MM-dd');
}

export const PLAN_CATEGORIES = [
  { key: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { key: 'event',      label: 'Event',      emoji: '🎟️' },
  { key: 'kids',       label: 'Kids',       emoji: '⚽' },
  { key: 'other',      label: 'Other',      emoji: '📌' },
];

function toggleClass(active) {
  return `px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
    active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }`;
}

export function PlanForm({ initial, defaultDate, onSave, onCancel, onDelete }) {
  const [title,    setTitle]    = useState(initial?.title    || '');
  const [date,     setDate]     = useState(initial?.date     || defaultDate || today());
  const [time,     setTime]     = useState(initial?.time     || '');
  const [category, setCategory] = useState(initial?.category || 'other');
  const [person,   setPerson]   = useState(initial?.person   || 'both');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ type: 'plan', title: title.trim(), date, time: time.trim(), category, person });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          autoFocus
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Dinner at Nobu, Soccer game, Concert..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <div className="flex gap-2 flex-wrap">
          {PLAN_CATEGORIES.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={toggleClass(category === c.key)}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Who */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Who</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPerson('both')}    className={toggleClass(person === 'both')}>Both</button>
          <button type="button" onClick={() => setPerson('zach')}    className={toggleClass(person === 'zach')}>Zach</button>
          <button type="button" onClick={() => setPerson('arianne')} className={toggleClass(person === 'arianne')}>Arianne</button>
        </div>
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={time}
            onChange={e => setTime(e.target.value)}
            placeholder="e.g. 7:30 PM"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {initial ? 'Update Plan' : 'Add Plan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Delete — only shown when editing */}
      {initial && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(initial.id)}
          className="w-full py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-red-100"
        >
          Delete Plan
        </button>
      )}
    </form>
  );
}
