import { useState } from 'react';
import { parseNaturalLanguage, describeParseResult } from '../../services/nlpParser';

const EXAMPLES = [
  'Zach UA123 Mar 20',
  'Arianne Golden Mar 13–18',
  'Zach Marriott Milwaukee Mar 17–19',
  'both Naperville Mar 13',
];

export function QuickAdd({ onAdd }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [flash, setFlash] = useState(false);

  function handleChange(e) {
    const val = e.target.value;
    setText(val);
    if (val.trim().length > 3) {
      const parsed = parseNaturalLanguage(val);
      setPreview(parsed.length > 0 ? parsed : null);
    } else {
      setPreview(null);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const parsed = parseNaturalLanguage(text);
    if (parsed.length === 0) return;

    // If any required field is missing, open the edit modal with pre-filled data
    const needsReview = parsed.some(e =>
      (e.type === 'flight' && !e.flightNumber) ||
      (e.type !== 'flight' && !e.city)
    );

    parsed.forEach(event => onAdd(event, needsReview && parsed.length === 1));

    // Flash confirmation
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
    setText('');
    setPreview(null);

    // Rotate example placeholder
    setExampleIdx(i => (i + 1) % EXAMPLES.length);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setText(''); setPreview(null); }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-2">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-center gap-2 bg-white border-2 rounded-xl px-3 py-2 shadow-sm transition-colors ${flash ? 'border-emerald-400 bg-emerald-50' : preview ? 'border-indigo-400' : 'border-gray-200 focus-within:border-indigo-400'}`}>
          <span className="text-gray-400 flex-shrink-0 text-lg">⚡</span>
          <input
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={`Quick add — e.g. "${EXAMPLES[exampleIdx]}"`}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
          />
          {text && (
            <button
              type="button"
              onClick={() => { setText(''); setPreview(null); }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 cursor-pointer"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex-shrink-0 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {flash ? '✓ Added' : 'Add'}
          </button>
        </div>

        {/* Live preview */}
        {preview && preview.length > 0 && !flash && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-indigo-200 rounded-xl shadow-lg px-4 py-2.5 z-30">
            <p className="text-xs text-gray-500 mb-1">Will add:</p>
            <p className="text-sm text-indigo-700 font-medium">{describeParseResult(preview)}</p>
            {preview.some(e => (e.type === 'flight' && !e.flightNumber) || (e.type !== 'flight' && !e.city)) && (
              <p className="text-xs text-amber-600 mt-1">⚠ Some details missing — form will open to complete.</p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
