export default async function handler(req, res) {
  const { flight, date } = req.query;
  const apiKey = process.env.AVIATIONSTACK_KEY;

  if (!apiKey) {
    return res.status(200).json({ success: false, reason: 'no_api_key' });
  }
  if (!flight || !date) {
    return res.status(400).json({ success: false, reason: 'missing_params' });
  }

  try {
    const iata = flight.toUpperCase().replace(/\s/g, '');
    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${iata}&flight_date=${date}`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.error) {
      return res.status(200).json({ success: false, reason: 'api_error', message: json.error.message });
    }

    if (!json.data || json.data.length === 0) {
      return res.status(200).json({ success: false, reason: 'not_found' });
    }

    const f = json.data[0];

    function fmt(iso) {
      if (!iso) return '';
      try {
        return new Date(iso).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true,
        });
      } catch { return iso; }
    }

    return res.status(200).json({
      success: true,
      fromCity: f.departure?.airport || '',
      fromCode: f.departure?.iata   || '',
      toCity:   f.arrival?.airport  || '',
      toCode:   f.arrival?.iata     || '',
      departureTime: fmt(f.departure?.scheduled),
      arrivalTime:   fmt(f.arrival?.scheduled),
    });
  } catch (err) {
    return res.status(200).json({ success: false, reason: 'api_error', message: err.message });
  }
}
