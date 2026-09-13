export default async function handler(req, res) {
  const { flight, date } = req.query;
  const apiKey = process.env.AERODATABOX_KEY;

  if (!apiKey) {
    return res.status(200).json({ success: false, reason: 'no_api_key' });
  }
  if (!flight || !date) {
    return res.status(400).json({ success: false, reason: 'missing_params' });
  }

  try {
    const iata = flight.toUpperCase().replace(/\s/g, '');
    const url = `https://aerodatabox.p.rapidapi.com/flights/number/${iata}/${date}`;
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key':  apiKey,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      return res.status(200).json({ success: false, reason: 'api_error', message: `HTTP ${response.status}` });
    }

    const json = await response.json();

    // AeroDataBox returns an array of flights (same number, different routes/codeshares)
    if (!Array.isArray(json) || json.length === 0) {
      return res.status(200).json({ success: false, reason: 'not_found' });
    }

    // Prefer flights touching our home airports first.
    // Covers Denver, Chicago (O'Hare + Midway), Milwaukee, New York (JFK/LGA/EWR).
    const HOME_AIRPORTS = new Set(['DEN', 'ORD', 'MDW', 'MKE', 'JFK', 'LGA', 'EWR']);

    function score(flight) {
      const dep = flight.departure?.airport?.iata || '';
      const arr = flight.arrival?.airport?.iata   || '';
      return (HOME_AIRPORTS.has(dep) ? 2 : 0) + (HOME_AIRPORTS.has(arr) ? 1 : 0);
    }

    const f = json.slice().sort((a, b) => score(b) - score(a))[0];

    // AeroDataBox local time format: "2024-03-16 07:30-06:00"
    // Extract just the HH:MM part and convert to 12-hour format
    function fmtLocal(localStr) {
      if (!localStr) return '';
      try {
        // Pull the time portion before any timezone offset
        const timePart = localStr.split(' ')[1]?.split(/[+-]/)[0]; // e.g. "07:30"
        if (!timePart) return '';
        const [h, m] = timePart.split(':').map(Number);
        const ampm  = h >= 12 ? 'PM' : 'AM';
        const hour  = h % 12 || 12;
        return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
      } catch {
        return '';
      }
    }

    return res.status(200).json({
      success:       true,
      fromCity:      f.departure?.airport?.municipalityName || f.departure?.airport?.name || '',
      fromCode:      f.departure?.airport?.iata || '',
      toCity:        f.arrival?.airport?.municipalityName   || f.arrival?.airport?.name   || '',
      toCode:        f.arrival?.airport?.iata  || '',
      departureTime: fmtLocal(f.departure?.scheduledTime?.local),
      arrivalTime:   fmtLocal(f.arrival?.scheduledTime?.local),
    });
  } catch (err) {
    return res.status(200).json({ success: false, reason: 'api_error', message: err.message });
  }
}
