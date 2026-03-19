function loadApiKey() {
  try {
    const config = JSON.parse(localStorage.getItem('travel_api_config') || '{}');
    return config.aviationstackKey || null;
  } catch {
    return null;
  }
}

export function saveApiKey(key) {
  try {
    localStorage.setItem('travel_api_config', JSON.stringify({ aviationstackKey: key }));
  } catch {
    // ignore
  }
}

export function getApiKey() {
  return loadApiKey();
}

export async function lookupFlight(flightNumber, date) {
  const apiKey = loadApiKey();

  if (!apiKey) {
    return { success: false, reason: 'no_api_key' };
  }

  try {
    const iata = flightNumber.toUpperCase().replace(/\s/g, '');
    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${iata}&flight_date=${date}`;
    const res = await fetch(url);

    if (!res.ok) {
      return { success: false, reason: 'api_error', message: `HTTP ${res.status}` };
    }

    const json = await res.json();

    if (json.error) {
      return { success: false, reason: 'api_error', message: json.error.message };
    }

    if (!json.data || json.data.length === 0) {
      return { success: false, reason: 'not_found' };
    }

    const f = json.data[0];
    return {
      success: true,
      fromCity: f.departure?.airport || '',
      fromCode: f.departure?.iata || '',
      toCity: f.arrival?.airport || '',
      toCode: f.arrival?.iata || '',
      departureTime: f.departure?.scheduled || '',
      arrivalTime: f.arrival?.scheduled || '',
    };
  } catch (err) {
    return { success: false, reason: 'api_error', message: err.message };
  }
}
