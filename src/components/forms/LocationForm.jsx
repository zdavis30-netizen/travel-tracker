import { useState } from 'react';
import { Button } from '../ui/Button';
import { PEOPLE, PERSON_LABELS, COMMON_LOCATIONS } from '../../constants';
import { format } from 'date-fns';

function today() {
  return format(new Date(), 'yyyy-MM-dd');
}

function ToggleButtons({ value, onChange, options }) {
  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
            value === opt.value
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function LocationForm({ initial, onSave, onCancel }) {
  const [person, setPerson] = useState(initial?.person || 'zach');
  const initialIsCommon = COMMON_LOCATIONS.includes(initial?.city);
  const [selectedLocation, setSelectedLocation] = useState(
    initialIsCommon ? initial.city : (initial?.city ? 'other' : '')
  );
  const [customCity, setCustomCity] = useState(
    initialIsCommon ? '' : (initial?.city || '')
  );
  const [dateFrom, setDateFrom] = useState(initial?.dateFrom || today());
  const [dateTo, setDateTo] = useState(initial?.dateTo || today());
  const [hasKids, setHasKids] = useState(initial?.hasKids ?? false);
  const [together, setTogether] = useState(initial?.together ?? false);

  const city = selectedLocation === 'other' ? customCity : selectedLocation;

  function handleSubmit(e) {
    e.preventDefault();
    if (!city.trim()) return;
    onSave({ type: 'location', person, city: city.trim(), dateFrom, dateTo, hasKids, together });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Person</label>
        <ToggleButtons
          value={person}
          onChange={setPerson}
          options={PEOPLE.map(p => ({ value: p, label: PERSON_LABELS[p] }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {COMMON_LOCATIONS.map(loc => (
            <button
              key={loc}
              type="button"
              onClick={() => setSelectedLocation(loc)}
              className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer ${
                selectedLocation === loc
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {loc}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedLocation('other')}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer ${
              selectedLocation === 'other'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Other…
          </button>
        </div>
        {selectedLocation === 'other' && (
          <input
            type="text"
            value={customCity}
            onChange={e => setCustomCity(e.target.value)}
            placeholder="Type a city or location"
            autoFocus
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Kids with you?</label>
        <ToggleButtons
          value={hasKids}
          onChange={setHasKids}
          options={[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Together with {person === 'zach' ? 'Arianne' : 'Zach'}?
        </label>
        <ToggleButtons
          value={together}
          onChange={setTogether}
          options={[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ]}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {initial ? 'Update Location' : 'Add Location'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
