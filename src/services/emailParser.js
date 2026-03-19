/**
 * Parses pasted travel confirmation email text into structured event objects.
 * Handles common patterns from major airlines, hotel chains, and booking sites.
 */

// ─── Date parsing ────────────────────────────────────────────────────────────

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

function parseEmailDate(raw) {
  if (!raw) return '';
  const s = raw.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // MM/DD/YYYY or M/D/YY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    let [, m, d, y] = slashMatch;
    if (y.length === 2) y = '20' + y;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // "March 15, 2026" or "15 March 2026" or "Mar 15 2026"
  const wordMatch = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})|([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (wordMatch) {
    let day, month, year;
    if (wordMatch[1]) {
      day = wordMatch[1]; month = MONTH_MAP[wordMatch[2].toLowerCase()]; year = wordMatch[3];
    } else {
      month = MONTH_MAP[wordMatch[4].toLowerCase()]; day = wordMatch[5]; year = wordMatch[6];
    }
    if (month) return `${year}-${month}-${day.padStart(2, '0')}`;
  }

  return '';
}

// ─── Flight detection ─────────────────────────────────────────────────────────

const AIRLINE_PREFIXES = ['AA', 'UA', 'DL', 'WN', 'B6', 'AS', 'NK', 'F9', 'G4', 'SY',
  'BA', 'LH', 'AF', 'KL', 'IB', 'EI', 'FR', 'U2', 'EK', 'QR', 'SQ', 'CX', 'JL', 'NH'];

function extractFlightNumbers(text) {
  const pattern = new RegExp(
    `\\b(${AIRLINE_PREFIXES.join('|')}|[A-Z]{2})\\s*(\\d{1,4})\\b`,
    'gi'
  );
  const matches = [];
  let m;
  while ((m = pattern.exec(text)) !== null) {
    matches.push((m[1] + m[2]).toUpperCase());
  }
  return [...new Set(matches)];
}

const IATA_CODE_RE = /\b([A-Z]{3})\b/g;
const AIRPORT_CITY_RE = /(?:from|depart(?:ing|ure)?|origin)[:\s]+([A-Za-z\s,]+?)(?:\s+\(([A-Z]{3})\))?(?:\s+to|\s+→|\s+->|$)/i;
const DEST_CITY_RE = /(?:to|arriv(?:al|ing)|destination)[:\s]+([A-Za-z\s,]+?)(?:\s+\(([A-Z]{3})\))?(?:\s*$|\s*[\n,])/i;

function extractRoute(text) {
  let fromCity = '', fromCode = '', toCity = '', toCode = '';

  const fromMatch = text.match(AIRPORT_CITY_RE);
  if (fromMatch) {
    fromCity = fromMatch[1].trim();
    fromCode = fromMatch[2] || '';
  }

  const toMatch = text.match(DEST_CITY_RE);
  if (toMatch) {
    toCity = toMatch[1].trim();
    toCode = toMatch[2] || '';
  }

  // Fallback: look for "CITY (CODE) → CITY (CODE)" pattern
  if (!fromCity || !toCity) {
    const arrowMatch = text.match(/([A-Za-z\s]+?)\s*\(([A-Z]{3})\)\s*(?:→|->|to)\s*([A-Za-z\s]+?)\s*\(([A-Z]{3})\)/i);
    if (arrowMatch) {
      fromCity = fromCity || arrowMatch[1].trim();
      fromCode = fromCode || arrowMatch[2];
      toCity = toCity || arrowMatch[3].trim();
      toCode = toCode || arrowMatch[4];
    }
  }

  return { fromCity, fromCode, toCity, toCode };
}

function extractTime(text, keyword) {
  const re = new RegExp(`${keyword}[:\\s]+([0-9]{1,2}:[0-9]{2}\\s*(?:AM|PM|am|pm)?)`, 'i');
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

function extractFlightDate(text) {
  // "departing March 15, 2026" or "Date: March 15" or "Flight date: 03/15/2026"
  const patterns = [
    /(?:flight\s+date|departure\s+date|departs?|departing)[:\s]+([A-Za-z0-9,\/\s]+?\d{4})/i,
    /(?:date)[:\s]+([A-Za-z0-9,\/\s]+?\d{4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const d = parseEmailDate(m[1].trim());
      if (d) return d;
    }
  }
  return '';
}

// ─── Hotel detection ──────────────────────────────────────────────────────────

const HOTEL_KEYWORDS = /\b(hotel|marriott|hilton|hyatt|sheraton|westin|holiday inn|courtyard|residence inn|hampton inn|doubletree|fairfield|aloft|w hotel|four seasons|ritz|airbnb|vrbo|booking|check.?in|check.?out|reservation)\b/i;

function isHotelEmail(text) {
  return HOTEL_KEYWORDS.test(text);
}

function extractHotelName(text) {
  // "Hotel: Name" or "Property: Name" or "You're staying at Name"
  const patterns = [
    /(?:hotel|property|resort|inn|suites?)[:\s]+([A-Za-z0-9\s&',.-]+?)(?:\n|,|\.|at\s)/i,
    /(?:staying\s+at|booked\s+at|reservation\s+at)\s+([A-Za-z0-9\s&',.-]+?)(?:\n|,|\.)/i,
    /^([A-Za-z0-9\s&',.-]+(?:hotel|inn|suites?|resort|lodge|marriott|hilton|hyatt|sheraton|westin)[A-Za-z0-9\s&',.-]*)/im,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1].trim().length > 3) return m[1].trim();
  }
  return '';
}

function extractCity(text) {
  const patterns = [
    /(?:city|location|destination|hotel\s+city)[:\s]+([A-Za-z\s,]+?)(?:\n|,|$)/i,
    /(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+(?:[A-Z]{2}|\d{5})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().replace(/,$/, '');
  }
  return '';
}

function extractCheckinDates(text) {
  const ciMatch = text.match(/(?:check-?in|arrival)[:\s]+([A-Za-z0-9,\/\s]+?\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i);
  const coMatch = text.match(/(?:check-?out|departure)[:\s]+([A-Za-z0-9,\/\s]+?\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i);
  return {
    dateFrom: ciMatch ? parseEmailDate(ciMatch[1].trim()) : '',
    dateTo: coMatch ? parseEmailDate(coMatch[1].trim()) : '',
  };
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseEmailText(text, defaultPerson = 'zach') {
  const results = [];
  const warnings = [];

  const flightNumbers = extractFlightNumbers(text);
  const looksLikeHotel = isHotelEmail(text);

  // --- Flight parsing ---
  if (flightNumbers.length > 0) {
    const date = extractFlightDate(text);
    const { fromCity, fromCode, toCity, toCode } = extractRoute(text);
    const departureTime = extractTime(text, 'depart(?:s|ure)?');
    const arrivalTime = extractTime(text, 'arriv(?:es|al)');

    for (const fn of flightNumbers) {
      results.push({
        type: 'flight',
        person: defaultPerson,
        flightNumber: fn,
        date,
        fromCity,
        fromCode,
        toCity,
        toCode,
        departureTime,
        arrivalTime,
        autoFilled: false,
      });
    }
    if (!date) warnings.push('Could not detect flight date — please set it manually.');
    if (!fromCity && !toCity) warnings.push('Could not detect route — please fill in origin/destination.');
  }

  // --- Hotel parsing ---
  if (looksLikeHotel && flightNumbers.length === 0) {
    const hotelName = extractHotelName(text);
    const city = extractCity(text);
    const { dateFrom, dateTo } = extractCheckinDates(text);

    results.push({
      type: 'hotel',
      person: defaultPerson,
      hotelName,
      city,
      dateFrom,
      dateTo,
    });

    if (!city) warnings.push('Could not detect city — please fill it in manually.');
    if (!dateFrom) warnings.push('Could not detect check-in date — please set it manually.');
    if (!dateTo) warnings.push('Could not detect check-out date — please set it manually.');
  }

  if (results.length === 0) {
    warnings.push('No flight or hotel information detected. Try adding details manually.');
  }

  return { results, warnings };
}
