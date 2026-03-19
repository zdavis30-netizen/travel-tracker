/**
 * Expected CSV columns (case-insensitive):
 *   type, person, city, date_from, date_to, flight_number,
 *   from_city, from_code, to_city, to_code, departure_time, arrival_time, hotel_name
 *
 * type values: location | flight | hotel
 * person values: zach | arianne (or Zach | Arianne)
 */

const COLUMN_ALIASES = {
  type: ['type'],
  person: ['person', 'who'],
  city: ['city', 'location'],
  dateFrom: ['date_from', 'datefrom', 'from', 'start', 'start_date', 'checkin', 'check_in', 'date'],
  dateTo: ['date_to', 'dateto', 'to', 'end', 'end_date', 'checkout', 'check_out'],
  flightNumber: ['flight_number', 'flightnumber', 'flight', 'flight_no', 'flightno'],
  fromCity: ['from_city', 'fromcity', 'origin', 'departure_city'],
  fromCode: ['from_code', 'fromcode', 'origin_code', 'departure_code', 'from_iata'],
  toCity: ['to_city', 'tocity', 'destination', 'arrival_city'],
  toCode: ['to_code', 'tocode', 'destination_code', 'arrival_code', 'to_iata'],
  departureTime: ['departure_time', 'departuretime', 'departs', 'dep_time'],
  arrivalTime: ['arrival_time', 'arrivaltime', 'arrives', 'arr_time'],
  hotelName: ['hotel_name', 'hotelname', 'hotel', 'property'],
};

function normalizeHeader(header) {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

function buildColumnMap(headers) {
  const map = {};
  headers.forEach((raw, idx) => {
    const h = normalizeHeader(raw);
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(h)) {
        map[field] = idx;
      }
    }
  });
  return map;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeDate(raw) {
  if (!raw) return '';
  const trimmed = raw.trim();
  // Accept YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return trimmed;
}

function normalizePerson(raw) {
  const v = raw.trim().toLowerCase();
  if (v === 'zach' || v === 'z') return 'zach';
  if (v === 'arianne' || v === 'a' || v === 'ari') return 'arianne';
  return v;
}

function normalizeType(raw) {
  const v = raw.trim().toLowerCase();
  if (['location', 'loc', 'place', 'city'].includes(v)) return 'location';
  if (['flight', 'fly', 'plane', 'air'].includes(v)) return 'flight';
  if (['hotel', 'lodging', 'accommodation', 'stay', 'bnb', 'airbnb'].includes(v)) return 'hotel';
  return v;
}

function get(row, map, field) {
  const idx = map[field];
  return idx !== undefined ? (row[idx] || '').trim() : '';
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) {
    return { events: [], errors: ['CSV must have a header row and at least one data row.'] };
  }

  const headers = parseCSVLine(lines[0]);
  const colMap = buildColumnMap(headers);

  if (colMap.type === undefined || colMap.person === undefined) {
    return {
      events: [],
      errors: ['Missing required columns: "type" and "person" must be present.'],
    };
  }

  const events = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.every(c => !c)) continue; // skip blank rows

    const type = normalizeType(get(row, colMap, 'type'));
    const person = normalizePerson(get(row, colMap, 'person'));

    if (!['location', 'flight', 'hotel'].includes(type)) {
      errors.push(`Row ${i + 1}: unknown type "${type}" — skipped.`);
      continue;
    }
    if (!['zach', 'arianne'].includes(person)) {
      errors.push(`Row ${i + 1}: unknown person "${person}" — skipped.`);
      continue;
    }

    const base = { type, person, id: crypto.randomUUID(), createdAt: Date.now() };

    if (type === 'location') {
      const city = get(row, colMap, 'city');
      if (!city) { errors.push(`Row ${i + 1}: location requires "city" — skipped.`); continue; }
      events.push({ ...base, city, dateFrom: normalizeDate(get(row, colMap, 'dateFrom')), dateTo: normalizeDate(get(row, colMap, 'dateTo')) });
    } else if (type === 'flight') {
      const flightNumber = get(row, colMap, 'flightNumber');
      if (!flightNumber) { errors.push(`Row ${i + 1}: flight requires "flight_number" — skipped.`); continue; }
      events.push({
        ...base,
        flightNumber: flightNumber.toUpperCase(),
        date: normalizeDate(get(row, colMap, 'dateFrom') || get(row, colMap, 'dateFrom')),
        fromCity: get(row, colMap, 'fromCity'),
        fromCode: get(row, colMap, 'fromCode'),
        toCity: get(row, colMap, 'toCity'),
        toCode: get(row, colMap, 'toCode'),
        departureTime: get(row, colMap, 'departureTime'),
        arrivalTime: get(row, colMap, 'arrivalTime'),
        autoFilled: false,
      });
    } else if (type === 'hotel') {
      const city = get(row, colMap, 'city');
      if (!city) { errors.push(`Row ${i + 1}: hotel requires "city" — skipped.`); continue; }
      events.push({
        ...base,
        city,
        hotelName: get(row, colMap, 'hotelName'),
        dateFrom: normalizeDate(get(row, colMap, 'dateFrom')),
        dateTo: normalizeDate(get(row, colMap, 'dateTo')),
      });
    }
  }

  return { events, errors };
}

export const CSV_TEMPLATE_ROWS = [
  ['type', 'person', 'city', 'date_from', 'date_to', 'flight_number', 'from_city', 'from_code', 'to_city', 'to_code', 'departure_time', 'arrival_time', 'hotel_name'],
  ['location', 'Zach', 'Naperville', '2026-03-13', '2026-03-20', '', '', '', '', '', '', '', ''],
  ['location', 'Arianne', 'Golden', '2026-03-13', '2026-03-18', '', '', '', '', '', '', '', ''],
  ['flight', 'Zach', '', '2026-03-21', '', 'UA1234', 'Chicago', 'ORD', 'Denver', 'DEN', '8:30 AM', '10:45 AM', ''],
  ['hotel', 'Arianne', 'Milwaukee', '2026-03-19', '2026-03-22', '', '', '', '', '', '', '', 'Marriott Downtown'],
];

export function generateCSVTemplate() {
  return CSV_TEMPLATE_ROWS.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

export function downloadTemplate() {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'travel-tracker-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
