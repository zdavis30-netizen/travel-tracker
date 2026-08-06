// Predefined locations with color themes used across calendar cells and quick-add chips.
export const LOCATIONS = [
  { id: 'naperville', label: 'Naperville', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  { id: 'golden',     label: 'Golden',     color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', text: '#9a3412' },
  { id: 'milwaukee',  label: 'Milwaukee',  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6' },
  { id: 'denver',     label: 'Denver',     color: '#dc2626', bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
  { id: 'chicago',    label: 'Chicago',    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
];

/** Returns color metadata for a city string, or null for unknown locations. */
export function getLocationMeta(city) {
  if (!city) return null;
  const lower = city.toLowerCase().trim();
  return LOCATIONS.find(l => l.label.toLowerCase() === lower || l.id === lower) ?? null;
}
