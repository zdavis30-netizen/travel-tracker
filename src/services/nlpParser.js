import { format, addDays, nextSaturday, nextMonday, parseISO, isValid } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() { return format(new Date(), 'yyyy-MM-dd'); }
function fmtDate(d) { return format(d, 'yyyy-MM-dd'); }

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function resolveYear(month, day) {
  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(year, month - 1, day);
  // If the date has already passed this year, assume next year
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (candidate < todayMidnight) year += 1;
  return year;
}

/**
 * Parse a single date string like "Mar 20", "March 20", "3/20", "03/20/2026", "tomorrow", "today"
 * Returns "yyyy-MM-dd" string or null.
 */
function parseSingleDate(raw) {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();

  if (s === 'today') return todayStr();
  if (s === 'tomorrow') return fmtDate(addDays(new Date(), 1));
  if (s === 'this weekend' || s === 'weekend') return fmtDate(nextSaturday(new Date()));
  if (s === 'next week') return fmtDate(nextMonday(new Date()));

  // ISO already
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // MM/DD or MM/DD/YYYY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (slashMatch) {
    const m = parseInt(slashMatch[1]);
    const d = parseInt(slashMatch[2]);
    const y = slashMatch[3] ? parseInt(slashMatch[3]) : resolveYear(m, d);
    const dt = new Date(y, m - 1, d);
    return isValid(dt) ? fmtDate(dt) : null;
  }

  // "Mar 20" or "March 20" or "Mar. 20"
  const wordMatch = s.match(/([a-z]+)\.?\s+(\d{1,2})/);
  if (wordMatch) {
    const month = MONTHS[wordMatch[1]];
    if (month) {
      const day = parseInt(wordMatch[2]);
      const year = resolveYear(month, day);
      const dt = new Date(year, month - 1, day);
      return isValid(dt) ? fmtDate(dt) : null;
    }
  }

  return null;
}

/**
 * Parse a date range. Returns { dateFrom, dateTo }.
 * Handles: "Mar 13-18", "Mar 13 to 18", "Mar 13 to Mar 18", "Mar 13 - Mar 20", single date
 */
function parseDateRange(raw) {
  if (!raw) return { dateFrom: null, dateTo: null };
  const s = raw.trim();

  // "Mar 13-18" or "Mar 13 - 18"
  const compactRange = s.match(/([A-Za-z]+\.?\s+\d{1,2})\s*[-–]\s*(\d{1,2})(?:\s|$)/);
  if (compactRange) {
    const fromStr = compactRange[1];
    const fromDate = parseSingleDate(fromStr);
    if (fromDate) {
      // Same month, different day
      const monthMatch = fromStr.match(/([A-Za-z]+)/);
      const month = monthMatch ? MONTHS[monthMatch[1].toLowerCase()] : null;
      if (month) {
        const toDay = parseInt(compactRange[2]);
        const year = parseInt(fromDate.slice(0, 4));
        const dt = new Date(year, month - 1, toDay);
        return { dateFrom: fromDate, dateTo: isValid(dt) ? fmtDate(dt) : fromDate };
      }
    }
  }

  // "Mar 13 to Mar 18" or "Mar 13 - Mar 18"
  const fullRange = s.match(/(.+?)\s*(?:to|-|–)\s*(.+)/i);
  if (fullRange) {
    const from = parseSingleDate(fullRange[1].trim());
    const to = parseSingleDate(fullRange[2].trim());
    if (from && to) return { dateFrom: from, dateTo: to };
    if (from) return { dateFrom: from, dateTo: from };
  }

  // Single date
  const single = parseSingleDate(s);
  return { dateFrom: single, dateTo: single };
}

// ─── Entity extractors ────────────────────────────────────────────────────────

const FLIGHT_RE = /\b([A-Z]{2})\s*(\d{1,4})\b/i;
const AIRLINE_CODES = new Set(['AA','UA','DL','WN','B6','AS','NK','F9','G4','SY','BA','LH','AF','KL','EK','QR','SQ','CX','JL','NH','AC','WS','TS']);

function extractFlightNumber(text) {
  const m = text.match(FLIGHT_RE);
  if (!m) return null;
  return (m[1].toUpperCase() + m[2]);
}

function extractPerson(text) {
  const lower = text.toLowerCase();
  const hasZach = /\bzach\b/.test(lower);
  const hasArianne = /\barianne\b|\bari\b/.test(lower);
  const hasBoth = /\bboth\b/.test(lower);
  if (hasBoth || (hasZach && hasArianne)) return 'both';
  if (hasZach) return 'zach';
  if (hasArianne) return 'arianne';
  return null;
}

const HOTEL_BRANDS = /marriott|hilton|hyatt|sheraton|westin|holiday inn|courtyard|residence inn|hampton inn|doubletree|fairfield|aloft|four seasons|ritz|ihg|radisson|best western|motel|lodge|suites/i;
const HOTEL_KEYWORDS = /\b(?:hotel|staying at|booked at|checked? in|check.?in|airbnb|vrbo)\b/i;

function isHotelIntent(text) {
  return HOTEL_BRANDS.test(text) || HOTEL_KEYWORDS.test(text);
}

const FLIGHT_KEYWORDS = /\b(?:fly(?:ing)?|flight|plane|depart(?:ing|s)?|airline)\b/i;

// Date patterns to extract from text (consume them so city detection isn't confused)
const DATE_RANGE_PATTERNS = [
  /([A-Za-z]+\.?\s+\d{1,2}\s*[-–to]+\s*(?:[A-Za-z]+\.?\s+)?\d{1,2}(?:\s*,?\s*\d{4})?)/i,
  /([A-Za-z]+\.?\s+\d{1,2}(?:\s*,?\s*\d{4})?)/i,
  /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?(?:\s*[-–to]+\s*\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)?)/,
  /\b(today|tomorrow|this weekend|next week|weekend)\b/i,
];

function extractDatesFromText(text) {
  for (const re of DATE_RANGE_PATTERNS) {
    const m = text.match(re);
    if (m) {
      const range = parseDateRange(m[1]);
      if (range.dateFrom) {
        const cleaned = text.replace(m[0], ' ').replace(/\s+/g, ' ').trim();
        return { ...range, remaining: cleaned };
      }
    }
  }
  return { dateFrom: null, dateTo: null, remaining: text };
}

function extractCity(text) {
  // Remove person names, keywords, and flight numbers
  let s = text
    .replace(/\b(?:zach|arianne|ari|both)\b/gi, '')
    .replace(FLIGHT_RE, '')
    .replace(/\b(?:fly(?:ing)?|flight|plane|at|in|to|from|on|the|a|an|is|will be|staying|hotel|for|and)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // What's left should be a city (or hotel + city)
  return s.length > 0 ? s : null;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Parse a natural language string into one or more travel event objects.
 * Returns an array of partial event objects (without id/createdAt).
 */
export function parseNaturalLanguage(text) {
  if (!text.trim()) return [];

  const person = extractPerson(text);
  const people = person === 'both' ? ['zach', 'arianne'] : person ? [person] : ['zach'];

  const flightNumber = extractFlightNumber(text);
  const { dateFrom, dateTo, remaining } = extractDatesFromText(text);

  const cityRaw = extractCity(remaining);

  // ── Flight ────────────────────────────────────────────────────────────────
  if (flightNumber || FLIGHT_KEYWORDS.test(text)) {
    return people.map(p => ({
      type: 'flight',
      person: p,
      flightNumber: flightNumber || '',
      date: dateFrom || '',
      fromCity: '',
      fromCode: '',
      toCity: cityRaw || '',
      toCode: '',
      departureTime: '',
      arrivalTime: '',
      autoFilled: false,
    }));
  }

  // ── Hotel ─────────────────────────────────────────────────────────────────
  if (isHotelIntent(text)) {
    // Try to split hotelName from city
    let hotelName = '';
    let city = cityRaw || '';
    const brandMatch = text.match(HOTEL_BRANDS);
    if (brandMatch) {
      hotelName = brandMatch[0];
      city = (cityRaw || '').replace(new RegExp(hotelName, 'i'), '').trim();
    }
    return people.map(p => ({
      type: 'hotel',
      person: p,
      hotelName,
      city,
      dateFrom: dateFrom || '',
      dateTo: dateTo || dateFrom || '',
    }));
  }

  // ── Location ──────────────────────────────────────────────────────────────
  return people.map(p => ({
    type: 'location',
    person: p,
    city: cityRaw || '',
    dateFrom: dateFrom || '',
    dateTo: dateTo || dateFrom || '',
  }));
}

/**
 * Returns a human-readable preview of what was parsed.
 */
export function describeParseResult(events) {
  return events.map(e => {
    const who = e.person === 'zach' ? 'Zach' : 'Arianne';
    if (e.type === 'flight') return `✈ ${who} · ${e.flightNumber || '(flight)'}${e.date ? ' · ' + e.date : ''}`;
    if (e.type === 'hotel') return `🏨 ${who} · ${e.city || '(city)'}${e.dateFrom ? ' · ' + e.dateFrom : ''}${e.dateTo && e.dateTo !== e.dateFrom ? ' – ' + e.dateTo : ''}`;
    return `📍 ${who} · ${e.city || '(city)'}${e.dateFrom ? ' · ' + e.dateFrom : ''}${e.dateTo && e.dateTo !== e.dateFrom ? ' – ' + e.dateTo : ''}`;
  }).join('  ·  ');
}
