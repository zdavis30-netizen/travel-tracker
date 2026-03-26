// Parses the Joint Calendar Google Sheet CSV format into app events
// Columns: Month, Day, Date, Zach in..., Ari in..., Together, Notes, Travel booked, To do/book?, Club days

const MONTH_MAP = {
  January: 1, February: 2, March: 3, April: 4,
  May: 5, June: 6, July: 7, August: 8,
  September: 9, October: 10, November: 11, December: 12,
};

// Normalize location names from the sheet to display names
function normalizeLocation(raw) {
  if (!raw) return '';
  const loc = raw.trim().replace(/\?/g, '').trim();
  if (!loc) return '';
  const lower = loc.toLowerCase();
  if (lower.startsWith('naper')) return 'Naperville';
  if (loc === 'MKE') return 'Milwaukee';
  return loc;
}

function parseDate(month, day) {
  const m = String(MONTH_MAP[month] || 1).padStart(2, '0');
  const d = String(parseInt(day) || 1).padStart(2, '0');
  return `2026-${m}-${d}`;
}

function parseCSVLine(line) {
  const cols = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuote = !inQuote;
    } else if (c === ',' && !inQuote) {
      cols.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  cols.push(cur);
  return cols;
}

export function parseSheetCSV(csvText) {
  const lines = csvText.trim().split('\n');

  // Parse all data rows (skip header)
  const rows = lines.slice(1).map(line => {
    const cols = parseCSVLine(line);
    const month = cols[0]?.trim();
    const dateNum = cols[2]?.trim();
    if (!month || !MONTH_MAP[month] || !dateNum) return null;

    return {
      dateStr: parseDate(month, dateNum),
      zachLoc: normalizeLocation(cols[3]),
      ariLoc: normalizeLocation(cols[4]),
      together: cols[5]?.trim() === 'X',
      notes: cols[6]?.trim() || '',
    };
  }).filter(Boolean);

  const events = [];

  // Group Zach location events (split on location OR kids status change)
  groupRuns(rows, r => `${r.zachLoc}|${zachHasKids(r)}`).forEach(g => {
    const [loc] = g.key.split('|');
    if (!loc) return;
    events.push({
      type: 'location',
      person: 'zach',
      city: loc,
      dateFrom: g.dateFrom,
      dateTo: g.dateTo,
      hasKids: g.rows.some(r => zachHasKids(r)),
      together: false,
    });
  });

  // Group Arianne location events
  groupRuns(rows, r => r.ariLoc).forEach(g => {
    if (!g.key) return;
    events.push({
      type: 'location',
      person: 'arianne',
      city: g.key,
      dateFrom: g.dateFrom,
      dateTo: g.dateTo,
      hasKids: false,
      together: false,
    });
  });

  // Group together events
  groupRuns(rows, r => String(r.together)).forEach(g => {
    if (g.key !== 'true') return;
    events.push({
      type: 'together',
      dateFrom: g.dateFrom,
      dateTo: g.dateTo,
      city: '',
    });
  });

  return events;
}

// Returns true if Zach has his kids on this row (based on notes)
function zachHasKids(row) {
  return /zach girls/i.test(row.notes);
}

// Groups consecutive rows with the same key value into runs
function groupRuns(rows, keyFn) {
  const groups = [];
  let current = null;
  for (const row of rows) {
    const key = keyFn(row);
    if (!current || key !== current.key) {
      if (current) groups.push(current);
      current = { key, dateFrom: row.dateStr, dateTo: row.dateStr, rows: [row] };
    } else {
      current.dateTo = row.dateStr;
      current.rows.push(row);
    }
  }
  if (current) groups.push(current);
  return groups;
}

// Fetch from the proxy API and parse
export async function fetchAndParseSheet() {
  const res = await fetch('/api/fetch-sheet');
  if (!res.ok) throw new Error('Could not fetch sheet data');
  const csv = await res.text();
  return parseSheetCSV(csv);
}
