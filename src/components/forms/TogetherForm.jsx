import { useState } from 'react';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

function today() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function TogetherForm({ initial, onSave, onCancel }) {
  const [dateFrom, setDateFrom] = useState(initial?.dateFrom || today());
  const [dateTo, setDateTo] = useState(initial?.dateTo || today());
  const [city, setCity] = useState(initial?.city || '');

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ type: 'together', dateFrom, dateTo, city: city.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
        <span>💚</span>
        <span>Mark the dates when you and Arianne are together. This shows as a green bar in the calendar.</span>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Where? (optional)</label>
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="e.g. Naperville, Denver, at home..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {initial ? 'Update Together' : 'Add Together'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
