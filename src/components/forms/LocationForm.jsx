import { useState } from 'react';
import { Button } from '../ui/Button';
import { PEOPLE, PERSON_LABELS } from '../../constants';
import { format } from 'date-fns';

function today() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function LocationForm({ initial, onSave, onCancel }) {
  const [person, setPerson] = useState(initial?.person || 'zach');
  const [city, setCity] = useState(initial?.city || '');
  const [dateFrom, setDateFrom] = useState(initial?.dateFrom || today());
  const [dateTo, setDateTo] = useState(initial?.dateTo || today());

  function handleSubmit(e) {
    e.preventDefault();
    if (!city.trim()) return;
    onSave({ type: 'location', person, city: city.trim(), dateFrom, dateTo });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Person</label>
        <div className="flex gap-2">
          {PEOPLE.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPerson(p)}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${person === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              {PERSON_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City / Location</label>
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="e.g. Naperville, Golden, Milwaukee"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={e => setDateTo(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {initial ? 'Update Location' : 'Add Location'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
