// API key stored locally (used only to show/hide the Settings prompt)
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
  } catch { }
}

export function getApiKey() {
  return loadApiKey();
}

// All lookups go through the server-side proxy at /api/lookup-flight
// so the API key stays secret and the HTTP/HTTPS restriction is bypassed.
export async function lookupFlight(flightNumber, date) {
  try {
    const iata = flightNumber.toUpperCase().replace(/\s/g, '');
    const url  = `/api/lookup-flight?flight=${encodeURIComponent(iata)}&date=${encodeURIComponent(date)}`;
    const res  = await fetch(url);
    if (!res.ok) return { success: false, reason: 'api_error' };
    return await res.json();
  } catch (err) {
    return { success: false, reason: 'api_error', message: err.message };
  }
}
