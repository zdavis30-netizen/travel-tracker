import { useState } from 'react';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

function today() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function NoteForm({ initial, defaultDate, onSave, onCancel }) {
  const [date, setDate] = useState(initial?.date || defaultDate || today());
  const [text, setText] = useState(initial?.text || '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSave({ type: 'note', date, text: text.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. Zach's parents visiting, dinner reservation at 7pm, kids pickup at 3…"
          rows={4}
          autoFocus
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1">
          {initial ? 'Update Note' : 'Save Note'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
