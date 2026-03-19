/**
 * Vercel serverless function — POST /api/send-weekly-digest
 * Called weekly (e.g. by cron-job.org every Sunday 8am).
 * Reads events from Firebase REST API, generates HTML email, sends via Resend.
 *
 * Required env vars (set in Vercel project settings):
 *   VITE_FIREBASE_DATABASE_URL, DIGEST_SECRET, RESEND_API_KEY,
 *   ZACH_EMAIL, ARIANNE_EMAIL
 */

const PEOPLE = ['zach', 'arianne'];
const PERSON_LABELS = { zach: 'Zach', arianne: 'Arianne' };
const TYPE_ICONS = { location: '📍', flight: '✈', hotel: '🏨' };

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISO(date) {
  return date.toISOString().split('T')[0];
}

function formatDayLabel(isoDate) {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function coversDate(event, dateStr) {
  if (event.type === 'flight') return event.date === dateStr;
  const from = event.dateFrom || '';
  const to = event.dateTo || '';
  return dateStr >= from && dateStr <= to;
}

// ─── Firebase fetch ───────────────────────────────────────────────────────────

async function fetchEvents(databaseUrl) {
  const url = `${databaseUrl.replace(/\/$/, '')}/events.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Firebase fetch failed: ${res.status}`);
  const data = await res.json();
  if (!data) return [];
  return Object.values(data);
}

// ─── Email generation ─────────────────────────────────────────────────────────

function buildWeekRows(events, startDate) {
  const days = Array.from({ length: 7 }, (_, i) => toISO(addDays(startDate, i)));

  return PEOPLE.map(person => {
    const rows = days.map(date => {
      const dayEvents = events.filter(e => e.person === person && coversDate(e, date));
      const cells = dayEvents.map(e => {
        if (e.type === 'flight') {
          const route = [e.fromCity || e.fromCode, e.toCity || e.toCode].filter(Boolean).join(' → ');
          return `✈ <strong>${e.flightNumber}</strong>${route ? ` · ${route}` : ''}`;
        }
        if (e.type === 'hotel') {
          return `🏨 ${e.city}${e.hotelName ? ` · ${e.hotelName}` : ''}`;
        }
        return `📍 ${e.city}`;
      });
      return { date, label: formatDayLabel(date), cells };
    });
    return { person, label: PERSON_LABELS[person], rows };
  });
}

function generateEmailHtml(weekRows, startDate, endDate) {
  const weekLabel = `${formatDayLabel(toISO(startDate))} – ${formatDayLabel(toISO(endDate))}`;

  const personSections = weekRows.map(({ label, rows }) => {
    const tableRows = rows.map(({ label: dayLabel, cells }) => {
      const content = cells.length > 0
        ? cells.map(c => `<span style="display:block">${c}</span>`).join('')
        : '<span style="color:#9ca3af">—</span>';
      return `
        <tr>
          <td style="padding:6px 12px 6px 0;white-space:nowrap;font-size:13px;color:#6b7280;vertical-align:top;width:110px">${dayLabel}</td>
          <td style="padding:6px 0;font-size:13px;color:#111827">${content}</td>
        </tr>`;
    }).join('');

    return `
      <div style="margin-bottom:24px">
        <h3 style="font-size:15px;font-weight:600;color:#4f46e5;margin:0 0 8px">${label}</h3>
        <table style="border-collapse:collapse;width:100%">${tableRows}</table>
      </div>`;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;border:1px solid #e5e7eb;padding:28px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      <span style="font-size:24px">✈️</span>
      <span style="font-size:18px;font-weight:700;color:#111827">Travel Tracker</span>
    </div>
    <p style="font-size:13px;color:#6b7280;margin:0 0 20px">Weekly digest · ${weekLabel}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px">
    ${personSections}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0 16px">
    <p style="font-size:11px;color:#9ca3af;margin:0">
      Sent by Travel Tracker · <a href="${process.env.VITE_APP_URL || ''}" style="color:#6366f1">Open app</a>
    </p>
  </div>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify secret token
  const secret = req.headers['x-digest-secret'] || req.query.secret;
  if (secret !== process.env.DIGEST_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const databaseUrl = process.env.VITE_FIREBASE_DATABASE_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const zachEmail = process.env.ZACH_EMAIL;
  const arianneEmail = process.env.ARIANNE_EMAIL;

  if (!databaseUrl || !resendKey || !zachEmail || !arianneEmail) {
    return res.status(500).json({ error: 'Missing required environment variables' });
  }

  try {
    const events = await fetchEvents(databaseUrl);

    const startDate = new Date();
    // Round to next Sunday (or today if Sunday)
    const dayOfWeek = startDate.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const weekStart = addDays(startDate, daysUntilSunday);
    const weekEnd = addDays(weekStart, 6);

    const weekRows = buildWeekRows(events, weekStart);
    const html = generateEmailHtml(weekRows, weekStart, weekEnd);
    const subject = `✈ Travel Digest · ${formatDayLabel(toISO(weekStart))} – ${formatDayLabel(toISO(weekEnd))}`;

    // Send via Resend
    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Travel Tracker <digest@yourdomain.com>', // update with your verified Resend domain
        to: [zachEmail, arianneEmail],
        subject,
        html,
      }),
    });

    if (!sendRes.ok) {
      const err = await sendRes.text();
      return res.status(500).json({ error: `Resend error: ${err}` });
    }

    return res.status(200).json({ ok: true, subject });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
