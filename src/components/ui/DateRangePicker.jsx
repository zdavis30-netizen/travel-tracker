import { DATE_PRESETS } from '../../constants';
import { Button } from './Button';

export function DateRangePicker({ start, end, activePreset, onPreset, onCustom }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {DATE_PRESETS.map(p => (
        <Button
          key={p.days}
          variant={activePreset === p.days ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onPreset(p.days)}
        >
          {p.label}
        </Button>
      ))}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <input
          type="date"
          value={start}
          onChange={e => onCustom(e.target.value, end)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span>–</span>
        <input
          type="date"
          value={end}
          onChange={e => onCustom(start, e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}
