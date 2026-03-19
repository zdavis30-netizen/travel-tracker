import { useState } from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PEOPLE, PERSON_LABELS } from '../../constants';
import { lookupFlight, getApiKey } from '../../services/flightLookup';
import { format } from 'date-fns';

function today() {
  return format(new Date(), 'yyyy-MM-dd');
}

const LOOKUP_REASONS = {
  no_api_key: 'No API key configured — enter details manually, or add one in Settings.',
  not_found: 'Flight not found for this date — please enter details manually.',
  api_error: 'Could not reach flight service — please enter details manually.',
};

export function FlightForm({ initial, onSave, onCancel }) {
  const [person, setPerson] = useState(initial?.person || 'zach');
  const [date, setDate] = useState(initial?.date || today());
  const [flightNumber, setFlightNumber] = useState(initial?.flightNumber || '');
  const [fromCity, setFromCity] = useState(initial?.fromCity || '');
  const [fromCode, setFromCode] = useState(initial?.fromCode || '');
  const [toCity, setToCity] = useState(initial?.toCity || '');
  const [toCode, setToCode] = useState(initial?.toCode || '');
  const [departureTime, setDepartureTime] = useState(initial?.departureTime || '');
  const [arrivalTime, setArrivalTime] = useState(initial?.arrivalTime || '');
  const [autoFilled, setAutoFilled] = useState(initial?.autoFilled || false);
  const [lookupState, setLookupState] = useState(null); // null | 'loading' | 'success' | 'error'
  const [lookupMessage, setLookupMessage] = useState('');

  const hasApiKey = !!getApiKey();

  async function handleLookup() {
    if (!flightNumber.trim() || !date) return;
    setLookupState('loading');
    setLookupMessage('');
    const result = await lookupFlight(flightNumber.trim(), date);
    if (result.success) {
      setFromCity(result.fromCity);
      setFromCode(result.fromCode);
      setToCity(result.toCity);
      setToCode(result.toCode);
      setDepartureTime(result.departureTime);
      setArrivalTime(result.arrivalTime);
      setAutoFilled(true);
      setLookupState('success');
    } else {
      setLookupState('error');
      setLookupMessage(LOOKUP_REASONS[result.reason] || LOOKUP_REASONS.api_error);
      setAutoFilled(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!flightNumber.trim()) return;
    onSave({
      type: 'flight',
      person,
      date,
      flightNumber: flightNumber.trim().toUpperCase(),
      fromCity,
      fromCode,
      toCity,
      toCode,
      departureTime,
      arrivalTime,
      autoFilled,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!hasApiKey && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <span>⚙️</span>
          <span>Add an AviationStack API key in <strong>Settings</strong> to enable automatic flight lookup.</span>
        </div>
      )}

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
        <label className="block text-sm font-medium text-gray-700 mb-1">Flight Date</label>
        <input
          type="date"
          value={date}
          onChange={e => { setDate(e.target.value); setLookupState(null); setAutoFilled(false); }}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Flight Number</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={flightNumber}
            onChange={e => { setFlightNumber(e.target.value); setLookupState(null); setAutoFilled(false); }}
            placeholder="e.g. UA1234, AA567"
            required
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {hasApiKey && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleLookup}
              disabled={lookupState === 'loading' || !flightNumber.trim()}
            >
              {lookupState === 'loading' ? <LoadingSpinner size="sm" /> : '🔍 Look Up'}
            </Button>
          )}
        </div>
        {lookupState === 'success' && (
          <p className="text-xs text-emerald-600 mt-1">✓ Flight details auto-filled — you can still edit below.</p>
        )}
        {lookupState === 'error' && (
          <p className="text-xs text-amber-600 mt-1">{lookupMessage}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From (City)</label>
          <input
            type="text"
            value={fromCity}
            onChange={e => setFromCity(e.target.value)}
            placeholder="e.g. Chicago"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From (IATA Code)</label>
          <input
            type="text"
            value={fromCode}
            onChange={e => setFromCode(e.target.value.toUpperCase())}
            placeholder="e.g. ORD"
            maxLength={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To (City)</label>
          <input
            type="text"
            value={toCity}
            onChange={e => setToCity(e.target.value)}
            placeholder="e.g. Denver"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To (IATA Code)</label>
          <input
            type="text"
            value={toCode}
            onChange={e => setToCode(e.target.value.toUpperCase())}
            placeholder="e.g. DEN"
            maxLength={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
          <input
            type="text"
            value={departureTime}
            onChange={e => setDepartureTime(e.target.value)}
            placeholder="e.g. 8:30 AM"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
          <input
            type="text"
            value={arrivalTime}
            onChange={e => setArrivalTime(e.target.value)}
            placeholder="e.g. 10:45 AM"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {initial ? 'Update Flight' : 'Add Flight'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
