import { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { parseCSV, downloadTemplate } from '../../services/csvImport';
import { parseEmailText } from '../../services/emailParser';
import { PEOPLE, PERSON_LABELS } from '../../constants';

const TABS = [
  { key: 'csv', label: '📊 Google Sheets / CSV' },
  { key: 'email', label: '✉️ Paste Email' },
];

// ─── CSV Tab ──────────────────────────────────────────────────────────────────

function CSVTab({ onImport }) {
  const [csvText, setCsvText] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target.result;
      setCsvText(text);
      setResult(parseCSV(text));
    };
    reader.readAsText(file);
  }

  function handleParse() {
    setResult(parseCSV(csvText));
  }

  function handleImport() {
    if (result?.events?.length) onImport(result.events);
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 space-y-1">
        <p className="font-medium">How to import from Google Sheets:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-xs text-blue-700">
          <li>Download the template below and open it in Google Sheets</li>
          <li>Fill in your travel data</li>
          <li>File → Download → Comma Separated Values (.csv)</li>
          <li>Upload or paste the CSV here</li>
        </ol>
      </div>

      <Button variant="secondary" size="sm" onClick={downloadTemplate} className="w-full justify-center">
        ⬇ Download Template CSV
      </Button>

      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}>
        <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
        <p className="text-sm text-gray-500">
          <span className="font-medium text-indigo-600">Upload CSV</span> or drag & drop
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Exported from Google Sheets or Excel</p>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1">Or paste CSV text directly:</p>
        <textarea
          value={csvText}
          onChange={e => { setCsvText(e.target.value); setResult(null); }}
          placeholder={'type,person,city,date_from,date_to\nlocation,Zach,Naperville,2026-03-13,2026-03-20'}
          rows={5}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <Button size="sm" variant="secondary" onClick={handleParse} disabled={!csvText.trim()} className="mt-1">
          Parse
        </Button>
      </div>

      {result && (
        <div className="space-y-2">
          {result.errors.length > 0 && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-amber-700">⚠ {e}</p>
              ))}
            </div>
          )}
          {result.events.length > 0 && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-xs text-emerald-700 font-medium">
                ✓ {result.events.length} event{result.events.length !== 1 ? 's' : ''} ready to import
              </p>
              <ul className="mt-1 space-y-0.5">
                {result.events.map((e, i) => (
                  <li key={i} className="text-xs text-emerald-600">
                    {e.type === 'flight' ? '✈' : e.type === 'hotel' ? '🏨' : '📍'}{' '}
                    {PERSON_LABELS[e.person]} · {e.type === 'flight' ? e.flightNumber : e.city}
                    {e.date || e.dateFrom ? ` · ${e.date || e.dateFrom}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.events.length > 0 && (
            <Button onClick={handleImport} className="w-full justify-center">
              Import {result.events.length} Event{result.events.length !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Email Tab ────────────────────────────────────────────────────────────────

function EmailTab({ onImport }) {
  const [emailText, setEmailText] = useState('');
  const [person, setPerson] = useState('zach');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleParse() {
    setLoading(true);
    // Small delay for UX feel
    setTimeout(() => {
      setResult(parseEmailText(emailText, person));
      setLoading(false);
    }, 300);
  }

  function handleImport() {
    if (result?.results?.length) {
      onImport(result.results.map(e => ({
        ...e,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      })));
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
        Paste the full text of a flight or hotel confirmation email. Works with most airlines and hotel chains.
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">This email is for:</label>
        <div className="flex gap-2">
          {PEOPLE.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => { setPerson(p); setResult(null); }}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${person === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              {PERSON_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Paste confirmation email:</label>
        <textarea
          value={emailText}
          onChange={e => { setEmailText(e.target.value); setResult(null); }}
          placeholder="Paste your flight or hotel confirmation email text here..."
          rows={8}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <Button
        onClick={handleParse}
        disabled={!emailText.trim() || loading}
        className="w-full justify-center"
        variant="secondary"
      >
        {loading ? <><LoadingSpinner size="sm" /> Parsing...</> : '🔍 Parse Email'}
      </Button>

      {result && (
        <div className="space-y-2">
          {result.warnings.length > 0 && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
              {result.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-700">⚠ {w}</p>
              ))}
            </div>
          )}
          {result.results.length > 0 && (
            <>
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-xs text-emerald-700 font-medium mb-1">Detected — review before importing:</p>
                {result.results.map((e, i) => (
                  <div key={i} className="text-xs text-emerald-700 space-y-0.5">
                    {e.type === 'flight' && (
                      <>
                        <p>✈ <strong>{e.flightNumber}</strong> · {e.date || '(date not found)'}</p>
                        {(e.fromCity || e.toCity) && <p className="ml-4">{e.fromCity || e.fromCode || '?'} → {e.toCity || e.toCode || '?'}</p>}
                        {(e.departureTime || e.arrivalTime) && <p className="ml-4">{e.departureTime && `Dep: ${e.departureTime}`}{e.departureTime && e.arrivalTime && ' · '}{e.arrivalTime && `Arr: ${e.arrivalTime}`}</p>}
                      </>
                    )}
                    {e.type === 'hotel' && (
                      <>
                        <p>🏨 {e.hotelName || '(hotel name not found)'} · {e.city || '(city not found)'}</p>
                        <p className="ml-4">{e.dateFrom || '?'} – {e.dateTo || '?'}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={handleImport} className="w-full justify-center">
                Import & Review in Form
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function ImportModal({ isOpen, onClose, onImport }) {
  const [activeTab, setActiveTab] = useState('csv');

  function handleImport(events) {
    onImport(events);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Travel Data">
      <div className="flex border-b border-gray-200 mb-4 -mx-6 px-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors mr-1 cursor-pointer ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'csv' && <CSVTab onImport={handleImport} />}
      {activeTab === 'email' && <EmailTab onImport={handleImport} />}
    </Modal>
  );
}
