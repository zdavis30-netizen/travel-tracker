// Proxy endpoint to fetch the Joint Calendar Google Sheet as CSV
// This avoids CORS issues when fetching from the browser
export default async function handler(req, res) {
  const SHEET_URL =
    'https://docs.google.com/spreadsheets/d/1JZsMpW2wb90DK3H02OKbGFdI8kNF0w7a-NZbJ0TrRvM/export?format=csv&gid=344815903';

  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch sheet' });
    }
    const text = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
