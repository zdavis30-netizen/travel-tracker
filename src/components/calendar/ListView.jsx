import { useMemo, useState, useRef, useEffect } from 'react';
import { format, parseISO, addDays, subDays, isWeekend } from 'date-fns';
import { getEventsForPersonOnDate, getTogetherOnDate, getNotesForDate, getTravelEventsForDate, getPlansForDate, coversDate } from '../../utils/eventUtils';
import { PLAN_CATEGORIES } from '../forms/PlanForm';
import { isDateToday } from '../../utils/dateUtils';
import { lookupFlight, getApiKey } from '../../services/flightLookup';

// ── Weather helpers (Open-Meteo — free, no key needed) ────────────────────────

function wmoIcon(code) {
  if (code === 0)              return '☀️';
  if (code === 1)              return '🌤️';
  if (code === 2)              return '⛅';
  if (code === 3)              return '☁️';
  if (code <= 48)              return '🌫️';
  if (code <= 55)              return '🌦️';
  if (code <= 65)              return '🌧️';
  if (code <= 77)              return '❄️';
  if (code <= 82)              return '🌦️';
  return '⛈️';
}

async function fetchCityWeather(city) {
  try {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    ).then(r => r.json());
    if (!geo.results?.length) return null;
    const { latitude, longitude } = geo.results[0];
    const wx = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`
    ).then(r => r.json());
    const code = wx.daily?.weathercode?.[0];
    const hi   = Math.round(wx.daily?.temperature_2m_max?.[0]);
    const lo   = Math.round(wx.daily?.temperature_2m_min?.[0]);
    if (code == null || isNaN(hi) || isNaN(lo)) return null;
    return { icon: wmoIcon(code), hi, lo };
  } catch { return null; }
}

// ── Together stats helpers ─────────────────────────────────────────────────────

function buildTogetherStats(events, upcomingDays) {
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const byMonth = {};
  let total = 0;
  let nextTogetherDate = null;

  upcomingDays.forEach(dateStr => {
    const zachCities    = new Set(events.filter(e => e.type === 'location' && e.person === 'zach'    && coversDate(e, dateStr)).map(e => e.city));
    const arianneCities = new Set(events.filter(e => e.type === 'location' && e.person === 'arianne' && coversDate(e, dateStr)).map(e => e.city));
    const sameCity      = [...zachCities].some(c => arianneCities.has(c));
    const explicit      = events.some(e => e.type === 'together' && coversDate(e, dateStr));

    if (sameCity || explicit) {
      if (!nextTogetherDate) nextTogetherDate = dateStr;
      total++;
      const [year, mon] = dateStr.split('-');
      const label = `${MONTH_NAMES[parseInt(mon, 10) - 1]}`;
      const key   = `${year}-${mon}`;
      if (!byMonth[key]) byMonth[key] = { label, count: 0 };
      byMonth[key].count++;
    }
  });

  return { total, byMonth, nextTogetherDate };
}

// ── Together stats panel ───────────────────────────────────────────────────────

function TogetherStats({ events, upcomingDays }) {
  const { total, byMonth, nextTogetherDate } = useMemo(
    () => buildTogetherStats(events, upcomingDays),
    [events, upcomingDays]
  );

  if (total === 0) return null;

  const months = Object.values(byMonth).filter(m => m.count > 0);
  const maxCount = Math.max(...months.map(m => m.count));

  // Days until next together
  let daysUntil = null;
  let nextLabel = null;
  if (nextTogetherDate) {
    const todayDate = new Date(); todayDate.setHours(0,0,0,0);
    const nextDate  = parseISO(nextTogetherDate);
    const diff = Math.round((nextDate - todayDate) / 86400000);
    daysUntil = diff;
    nextLabel = format(nextDate, 'MMM d');
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl px-4 py-4">
      {/* Headline */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">💚</span>
        <div>
          <p className="text-sm font-bold text-emerald-800">
            {total} day{total !== 1 ? 's' : ''} together in the next 6 months
          </p>
          {daysUntil !== null && (
            <p className="text-[11px] text-emerald-600 mt-0.5">
              {daysUntil === 0
                ? '🎉 You\'re together today!'
                : daysUntil === 1
                ? '✨ Together tomorrow!'
                : `Next together in ${daysUntil} days · ${nextLabel}`}
            </p>
          )}
        </div>
      </div>

      {/* Month breakdown */}
      {months.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {months.map(({ label, count }) => (
            <div key={label} className="flex-shrink-0 flex flex-col items-center gap-1">
              {/* Mini bar */}
              <div className="w-8 h-10 bg-emerald-100 rounded-md flex items-end overflow-hidden">
                <div
                  className="w-full bg-emerald-400 rounded-md transition-all"
                  style={{ height: `${Math.round((count / maxCount) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-emerald-700">{count}d</span>
              <span className="text-[10px] text-emerald-500">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── City summary helpers ───────────────────────────────────────────────────────

function buildCitySummary(events, upcomingDays) {
  const cityMap = {}; // city -> { zach: Set<dateStr>, arianne: Set<dateStr> }

  events
    .filter(e => e.type === 'location' && (e.person === 'zach' || e.person === 'arianne'))
    .forEach(event => {
      upcomingDays.forEach(dateStr => {
        if (coversDate(event, dateStr)) {
          if (!cityMap[event.city]) cityMap[event.city] = { zach: new Set(), arianne: new Set() };
          cityMap[event.city][event.person].add(dateStr);
        }
      });
    });

  return Object.entries(cityMap)
    .map(([city, { zach, arianne }]) => ({
      city,
      zachDays: zach.size,
      arianneDays: arianne.size,
      totalDays: new Set([...zach, ...arianne]).size,
    }))
    .filter(s => s.totalDays > 0)
    .sort((a, b) => b.totalDays - a.totalDays);
}

// ── City summary infographic ───────────────────────────────────────────────────

function CitySummary({ events, upcomingDays }) {
  const summary = useMemo(
    () => buildCitySummary(events, upcomingDays),
    [events, upcomingDays]
  );
  const [weather, setWeather] = useState({}); // city -> { icon, hi, lo } | null

  // Find cities active in the next 14 days and fetch their weather
  useEffect(() => {
    const soon = upcomingDays.slice(0, 14);
    const activeCities = new Set(
      events
        .filter(e => e.type === 'location' && soon.some(d => coversDate(e, d)))
        .map(e => e.city)
    );
    activeCities.forEach(async city => {
      if (weather[city] !== undefined) return; // already fetched or in flight
      setWeather(prev => ({ ...prev, [city]: 'loading' }));
      const data = await fetchCityWeather(city);
      setWeather(prev => ({ ...prev, [city]: data }));
    });
  }, [events, upcomingDays]); // eslint-disable-line react-hooks/exhaustive-deps

  if (summary.length === 0) return null;

  const totalUpcoming = upcomingDays.length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Where you'll be · next 6 months
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {summary.map(({ city, zachDays, arianneDays }) => {
          const zachPct    = Math.round((zachDays    / totalUpcoming) * 100);
          const ariannePct = Math.round((arianneDays / totalUpcoming) * 100);
          const isBoth     = zachDays > 0 && arianneDays > 0;
          const wx         = weather[city];

          return (
            <div
              key={city}
              className="flex-shrink-0 min-w-[130px] bg-gray-50/80 border border-gray-100 rounded-xl px-3 py-3"
            >
              {/* City name + weather */}
              <div className="flex items-start justify-between mb-2.5 gap-1">
                <p className="text-sm font-bold text-gray-800 truncate">{city}</p>
                {wx && wx !== 'loading' && (
                  <div className="flex-shrink-0 flex items-center gap-0.5 text-right">
                    <span className="text-base leading-none">{wx.icon}</span>
                    <span className="text-[11px] font-semibold text-gray-700 leading-none">{wx.hi}°</span>
                    <span className="text-[10px] text-gray-400 leading-none">/{wx.lo}°</span>
                  </div>
                )}
              </div>

              {/* Two-tone bar */}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2.5 flex">
                {zachDays > 0 && (
                  <div className="h-full bg-cyan-400 rounded-l-full" style={{ width: `${zachPct}%` }} />
                )}
                {arianneDays > 0 && (
                  <div
                    className={`h-full bg-purple-400 ${!zachDays ? 'rounded-full' : 'rounded-r-full'}`}
                    style={{ width: `${ariannePct}%` }}
                  />
                )}
              </div>

              {/* Person breakdown */}
              <div className="flex flex-col gap-1">
                {zachDays > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{zachDays}d</span> Zach
                    </span>
                  </div>
                )}
                {arianneDays > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{arianneDays}d</span> Arianne
                    </span>
                  </div>
                )}
                {isBoth && (
                  <div className="flex items-center gap-1.5 mt-0.5 pt-1.5 border-t border-gray-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{Math.min(zachDays, arianneDays)}d</span> together
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Inline travel quick-add ────────────────────────────────────────────────────

// Looks like a complete flight number: 2-3 letter code + 1-4 digits (e.g. UA1234, AA 567)
const FLIGHT_RE = /^[A-Z]{2,3}\s?\d{1,4}$/i;

function InlineTravelAdd({ dateStr, onSave, onCancel }) {
  const [person,       setPerson]       = useState('zach');
  const [type,         setType]         = useState('flight');
  const [value,        setValue]        = useState('');
  const [lookupState,  setLookupState]  = useState(null); // null | 'loading' | 'found' | 'not_found'
  const [preview,      setPreview]      = useState(null); // flight detail object from API
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Auto-lookup when flight number looks complete
  useEffect(() => {
    if (type !== 'flight') { setPreview(null); setLookupState(null); return; }
    if (!FLIGHT_RE.test(value.trim())) { setPreview(null); setLookupState(null); return; }
    // Always try — key lives server-side now

    setLookupState('loading');
    const timer = setTimeout(async () => {
      const result = await lookupFlight(value.trim(), dateStr);
      if (result.success) {
        setPreview(result);
        setLookupState('found');
      } else {
        setPreview(null);
        setLookupState('not_found');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [value, type, dateStr]);

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onCancel();
  }

  function handleSave() {
    if (!value.trim()) { onCancel(); return; }
    if (type === 'flight') {
      onSave({
        type: 'flight',
        person,
        date: dateStr,
        flightNumber: value.trim().toUpperCase().replace(/\s/g, ''),
        needsBooking: false,
        ...(preview ? {
          fromCity:      preview.fromCity,
          fromCode:      preview.fromCode,
          toCity:        preview.toCity,
          toCode:        preview.toCode,
          departureTime: preview.departureTime,
          arrivalTime:   preview.arrivalTime,
          autoFilled:    true,
        } : {}),
      });
    } else {
      onSave({ type: 'hotel', person, hotelName: value.trim(), city: value.trim(), dateFrom: dateStr, dateTo: dateStr, needsBooking: false });
    }
  }

  return (
    <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
      {/* Person + Type toggles */}
      <div className="flex items-center gap-1.5">
        <div className="flex rounded-md overflow-hidden border border-gray-200 text-xs">
          <button onClick={() => setPerson('zach')}    className={`px-2 py-1 font-bold transition-colors cursor-pointer ${person === 'zach'    ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>Z</button>
          <button onClick={() => setPerson('arianne')} className={`px-2 py-1 font-bold transition-colors cursor-pointer ${person === 'arianne' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>A</button>
        </div>
        <div className="flex rounded-md overflow-hidden border border-gray-200 text-xs">
          <button onClick={() => { setType('flight'); setPreview(null); setLookupState(null); }} className={`px-2 py-1 transition-colors cursor-pointer ${type === 'flight' ? 'bg-sky-500 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>✈</button>
          <button onClick={() => { setType('hotel');  setPreview(null); setLookupState(null); }} className={`px-2 py-1 transition-colors cursor-pointer ${type === 'hotel'  ? 'bg-teal-500 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>🏨</button>
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={type === 'flight' ? 'e.g. UA1234' : 'Hotel name…'}
          className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-0"
        />
        <button
          onClick={handleSave}
          disabled={!value.trim()}
          className="text-xs px-2 py-1.5 bg-indigo-600 text-white rounded-md disabled:opacity-30 hover:bg-indigo-700 cursor-pointer transition-colors font-medium"
        >✓</button>
      </div>

      {/* Flight lookup preview */}
      {type === 'flight' && lookupState === 'loading' && (
        <p className="text-[10px] text-gray-400 animate-pulse">Looking up flight…</p>
      )}
      {type === 'flight' && lookupState === 'found' && preview && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1.5 flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold text-emerald-700">
            ✓ {preview.fromCode || preview.fromCity} → {preview.toCode || preview.toCity}
          </p>
          {(preview.departureTime || preview.arrivalTime) && (
            <p className="text-[10px] text-emerald-600">
              {preview.departureTime}{preview.departureTime && preview.arrivalTime ? ' – ' : ''}{preview.arrivalTime}
            </p>
          )}
        </div>
      )}
      {type === 'flight' && lookupState === 'not_found' && (
        <p className="text-[10px] text-amber-500">Flight not found — will save number only</p>
      )}

      <button onClick={onCancel} className="text-[10px] text-gray-300 hover:text-gray-500 text-left cursor-pointer transition-colors">
        Esc to cancel
      </button>
    </div>
  );
}

// ── Location label (in person column) ─────────────────────────────────────────

function LocationLabel({ event, person, onToggleKids }) {
  const dotColor = person === 'zach' ? 'bg-cyan-400' : 'bg-purple-400';
  return (
    <div className="flex items-start gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${dotColor}`} />
        <span className="text-sm font-semibold text-gray-800 leading-tight">{event.city}</span>
      </div>
      {event.hasKids ? (
        onToggleKids ? (
          <button
            onClick={e => { e.stopPropagation(); onToggleKids(event); }}
            title="Tap to remove kids"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 leading-tight cursor-pointer hover:bg-amber-100 transition-colors"
          >
            👧 Kids
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 leading-tight">
            👧 Kids
          </span>
        )
      ) : (
        onToggleKids && (
          <button
            onClick={e => { e.stopPropagation(); onToggleKids(event); }}
            title="Tap to add kids"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-gray-300 border border-dashed border-gray-200 leading-tight cursor-pointer hover:text-amber-500 hover:border-amber-200 transition-colors"
          >
            + kids
          </button>
        )
      )}
    </div>
  );
}

// ── Plans column ──────────────────────────────────────────────────────────────

const CATEGORY_EMOJI = Object.fromEntries(PLAN_CATEGORIES.map(c => [c.key, c.emoji]));

function PlanChip({ plan, onEdit }) {
  const emoji = CATEGORY_EMOJI[plan.category] || '📌';
  return (
    <button
      onClick={e => { e.stopPropagation(); onEdit?.(plan); }}
      className="w-full text-left flex items-start gap-1 group"
    >
      <span className="text-[11px] mt-0.5 flex-shrink-0">{emoji}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-700 group-hover:text-indigo-600 leading-tight truncate transition-colors">
          {plan.title}
        </p>
        {plan.time && (
          <p className="text-[10px] text-gray-400 leading-tight">{plan.time}</p>
        )}
      </div>
    </button>
  );
}

// ── Travel column chips ────────────────────────────────────────────────────────

const PERSON_COLOR = {
  zach:    'text-cyan-600',
  arianne: 'text-purple-600',
};

function FlightDetail({ event }) {
  const personLabel = event.person === 'zach' ? 'Zach' : event.person === 'arianne' ? 'Arianne' : null;
  return (
    <div className="flex flex-col gap-0.5 pb-1.5 mb-1.5 border-b border-gray-100 last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        {event.needsBooking && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
            <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
            Needs booking
          </span>
        )}
        {personLabel && (
          <span className={`text-[10px] font-bold uppercase tracking-wide ${PERSON_COLOR[event.person]}`}>
            {personLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs">✈</span>
        <span className="text-xs font-semibold text-gray-800">{event.flightNumber}</span>
        {event.fromCity && event.toCity && (
          <span className="text-xs text-gray-500">{event.fromCity} → {event.toCity}</span>
        )}
      </div>
      {(event.departureTime || event.arrivalTime) && (
        <p className="text-[10px] text-gray-400 leading-none">
          {event.departureTime}{event.departureTime && event.arrivalTime ? ' – ' : ''}{event.arrivalTime}
        </p>
      )}
    </div>
  );
}

function HotelDetail({ event, dateStr }) {
  const personLabel = event.person === 'zach' ? 'Zach' : event.person === 'arianne' ? 'Arianne' : null;
  const isCheckIn  = event.dateFrom === dateStr;
  const isCheckOut = event.dateTo   === dateStr;
  return (
    <div className="flex flex-col gap-0.5 pb-1.5 mb-1.5 border-b border-gray-100 last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        {event.needsBooking && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
            <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
            Needs booking
          </span>
        )}
        {personLabel && (
          <span className={`text-[10px] font-bold uppercase tracking-wide ${PERSON_COLOR[event.person]}`}>
            {personLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs">🏨</span>
        <span className="text-xs font-semibold text-gray-800">{event.hotelName || event.city}</span>
        {event.hotelName && <span className="text-xs text-gray-400">{event.city}</span>}
      </div>
      <p className="text-[10px] text-gray-400 leading-none">
        {isCheckIn && isCheckOut
          ? 'Same-day'
          : isCheckIn
          ? `Check-in · out ${event.dateTo}`
          : `Check-out · in ${event.dateFrom}`}
      </p>
    </div>
  );
}

function TravelDetails({ events, dateStr }) {
  if (events.length === 0) return null;
  return (
    <div className="flex flex-col">
      {events.map((ev, i) => {
        if (ev.type === 'flight') return <FlightDetail key={i} event={ev} />;
        if (ev.type === 'hotel')  return <HotelDetail  key={i} event={ev} dateStr={dateStr} />;
        return null;
      })}
    </div>
  );
}

// ── Person column ──────────────────────────────────────────────────────────────

function PersonEvents({ events, person, onToggleKids }) {
  const locationEvents = events.filter(e => e.type === 'location');
  if (locationEvents.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {locationEvents.map((ev, i) => (
        <LocationLabel key={i} event={ev} person={person} onToggleKids={onToggleKids} />
      ))}
    </div>
  );
}

// ── Travel event info popover ─────────────────────────────────────────────────

function TravelPopover({ event, dateStr, onEdit, onClose, onSaveEvent, onDelete }) {
  const isFlight = event.type === 'flight';
  const isHotel  = event.type === 'hotel';
  const personLabel = event.person === 'zach' ? 'Zach' : 'Arianne';
  const personColor = event.person === 'zach' ? 'text-cyan-600' : 'text-purple-600';

  const [flightInfo, setFlightInfo] = useState(null); // fetched times
  const [fetching,   setFetching]   = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);

  // Auto-fetch times when popover opens if flight has no times stored
  useEffect(() => {
    if (!isFlight) return;
    if (event.departureTime || event.arrivalTime) return; // already have times
    if (!event.flightNumber || !dateStr) return;

    setFetching(true);
    setFetchFailed(false);
    lookupFlight(event.flightNumber, dateStr)
      .then(data => {
        if (data?.success) {
          setFlightInfo(data);
          // Silently save times back to the event so they show up next time
          if (onSaveEvent && event.id) {
            onSaveEvent({ ...event, ...data });
          }
        } else {
          setFetchFailed(true);
        }
      })
      .catch(() => setFetchFailed(true))
      .finally(() => setFetching(false));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Merge stored times with freshly-fetched times (fetched wins if stored empty)
  const depTime = event.departureTime || flightInfo?.departureTime;
  const arrTime = event.arrivalTime   || flightInfo?.arrivalTime;
  const fromCity = event.fromCity || flightInfo?.fromCity;
  const toCity   = event.toCity   || flightInfo?.toCity;
  const fromCode = event.fromCode || flightInfo?.fromCode;
  const toCode   = event.toCode   || flightInfo?.toCode;

  return (
    <div
      className="absolute z-30 right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3 flex flex-col gap-2"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-wide ${personColor}`}>{personLabel}</span>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-base leading-none cursor-pointer transition-colors">×</button>
      </div>

      {isFlight && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-lg">✈️</span>
            <div>
              <p className="text-sm font-bold text-gray-800">{event.flightNumber}</p>
              {fromCity && toCity && (
                <p className="text-xs text-gray-500 leading-tight">
                  {fromCity}{fromCode ? ` (${fromCode})` : ''} → {toCity}{toCode ? ` (${toCode})` : ''}
                </p>
              )}
            </div>
          </div>
          {fetching ? (
            <p className="text-xs text-gray-400 italic animate-pulse">Looking up flight times…</p>
          ) : (depTime || arrTime) ? (
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-800">{depTime || '—'}</span>
                <span className="text-[10px] text-gray-400">{fromCode || 'Dep'}</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full h-px bg-gray-300 relative">
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-gray-400 text-xs">✈</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-800">{arrTime || '—'}</span>
                <span className="text-[10px] text-gray-400">{toCode || 'Arr'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-500 italic">
              {fetchFailed ? 'Could not find flight times' : 'No times on file'}
            </p>
          )}
          {event.needsBooking && (
            <span className="self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
              ⚠ Needs booking
            </span>
          )}
        </>
      )}

      {isHotel && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏨</span>
            <div>
              <p className="text-sm font-bold text-gray-800">{event.hotelName || event.city}</p>
              {event.hotelName && event.city && <p className="text-xs text-gray-500">{event.city}</p>}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 flex flex-col gap-0.5">
            <p className="text-xs text-gray-600"><span className="font-semibold">Check-in:</span> {event.dateFrom}</p>
            <p className="text-xs text-gray-600"><span className="font-semibold">Check-out:</span> {event.dateTo}</p>
          </div>
          {event.needsBooking && (
            <span className="self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
              ⚠ Needs booking
            </span>
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => { onClose(); onEdit(event); }}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer transition-colors"
        >
          Edit →
        </button>
        {onDelete && event.id && (
          <button
            onClick={() => { onClose(); onDelete(event.id); }}
            className="text-xs text-red-400 hover:text-red-600 font-medium cursor-pointer transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── Day row ───────────────────────────────────────────────────────────────────

function DayRow({ dateStr, events, onDayClick, onAddEntry, onSaveEvent, onEditEvent, onDeleteEvent, isReadOnly }) {
  const [inlineOpen,       setInlineOpen]       = useState(false);
  const [expandedTravelId, setExpandedTravelId] = useState(null);

  const today         = isDateToday(dateStr);
  const together      = getTogetherOnDate(events, dateStr);
  const zachEvents    = getEventsForPersonOnDate(events, 'zach',    dateStr);
  const arianneEvents = getEventsForPersonOnDate(events, 'arianne', dateStr);
  const travelEvents  = getTravelEventsForDate(events, dateStr);
  const planEvents    = getPlansForDate(events, dateStr);
  const notes         = getNotesForDate(events, dateStr);

  function handleInlineSave(event) {
    onSaveEvent?.(event);
    setInlineOpen(false);
  }

  function handleToggleTogether() {
    if (together) {
      // Delete the existing together event
      const ev = events.find(e => e.type === 'together' && coversDate(e, dateStr));
      if (ev?.id) onDeleteEvent?.(ev.id);
    } else {
      // Create a single-day together event
      onSaveEvent?.({ type: 'together', dateFrom: dateStr, dateTo: dateStr });
    }
  }

  function handleToggleKids(locationEvent) {
    const { dateFrom, dateTo, hasKids } = locationEvent;

    // Single-day event OR tapping the first day of the range → toggle whole event
    if (dateFrom === dateTo || dateStr === dateFrom) {
      onSaveEvent?.({ ...locationEvent, hasKids: !hasKids });
      return;
    }

    // Multi-day event, tapping a date after the start → split at dateStr:
    //   Segment A: dateFrom → (dateStr - 1), keeps original hasKids
    //   Segment B: dateStr  → dateTo,        gets toggled hasKids
    const dayBefore = format(subDays(parseISO(dateStr), 1), 'yyyy-MM-dd');

    // Shorten the original event to end the day before the tap
    onSaveEvent?.({ ...locationEvent, dateTo: dayBefore });

    // Create a new event from the tapped date forward with toggled kids
    // Omit id/fbId so handleSave treats it as a new event
    const { id: _id, fbId: _fbId, ...rest } = locationEvent;
    onSaveEvent?.({ ...rest, dateFrom: dateStr, dateTo, hasKids: !hasKids });
  }

  const hasContent = zachEvents.length > 0 || arianneEvents.length > 0
    || travelEvents.length > 0 || planEvents.length > 0 || notes.length > 0 || together;

  const date    = parseISO(dateStr);
  const dayName = format(date, 'EEE');
  const dayNum  = format(date, 'MMM d');
  const weekend = isWeekend(date);

  if (!hasContent) {
    return (
      <div
        className={`flex items-center border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50/80 ${
          today ? 'border-l-4 border-l-indigo-400 bg-indigo-50/20' : weekend ? 'bg-gray-50/30' : 'bg-white'
        }`}
        onClick={() => onDayClick?.(dateStr)}
      >
        <div className={`w-24 flex-shrink-0 px-4 py-2 flex flex-col justify-center ${today ? 'bg-indigo-50/30' : ''}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-widest leading-none ${
            today ? 'text-indigo-500' : weekend ? 'text-gray-400' : 'text-gray-300'
          }`}>{today ? 'Today' : dayName}</span>
          <span className={`text-xs font-bold mt-0.5 ${
            today ? 'text-indigo-700' : weekend ? 'text-gray-500' : 'text-gray-300'
          }`}>{dayNum}</span>
        </div>
        <div className="flex-1 h-9 border-l border-gray-50" />
        <div className="flex-1 h-9 border-l border-gray-50" />
        {/* Plans cell (empty, desktop only) */}
        <div className="hidden md:block w-40 flex-shrink-0 h-9 border-l border-gray-50" />
        {/* Travel cell (desktop only) */}
        <div className={`hidden md:flex w-44 flex-shrink-0 border-l border-gray-50 ${inlineOpen ? 'p-2 bg-indigo-50/30' : 'h-9 items-center px-3'}`}>
          {inlineOpen ? (
            <InlineTravelAdd
              dateStr={dateStr}
              onSave={handleInlineSave}
              onCancel={() => setInlineOpen(false)}
            />
          ) : (
            !isReadOnly && (
              <button
                onClick={e => { e.stopPropagation(); setInlineOpen(true); }}
                className="text-xs text-gray-200 hover:text-indigo-400 cursor-pointer transition-colors"
              >+ flight or hotel</button>
            )
          )}
        </div>
        {!isReadOnly && (
          <div className="w-8 flex-shrink-0 flex items-center justify-center border-l border-gray-50">
            <button
              onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr); }}
              className="opacity-0 hover:opacity-100 text-gray-300 hover:text-indigo-400 text-lg leading-none cursor-pointer transition-all"
              title="Add event"
            >+</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col border-b transition-colors cursor-pointer group ${
        today
          ? 'border-indigo-100 bg-indigo-50/20 border-l-4 border-l-indigo-400'
          : 'border-gray-100 bg-white hover:bg-gray-50/40'
      }`}
      onClick={() => onDayClick?.(dateStr)}
    >
      <div className="flex">
        {/* Date */}
        <div className={`w-24 flex-shrink-0 px-4 py-3.5 flex flex-col justify-start ${today ? 'bg-indigo-50/30' : ''}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${
            today ? 'text-indigo-500' : 'text-gray-400'
          }`}>{today ? 'Today' : dayName}</span>
          <span className={`text-sm font-bold leading-tight mt-0.5 ${
            today ? 'text-indigo-700' : 'text-gray-800'
          }`}>{dayNum}</span>
          {!isReadOnly ? (
            <button
              onClick={e => { e.stopPropagation(); handleToggleTogether(); }}
              title={together ? 'Together — tap to remove' : 'Tap to mark as together'}
              className={`text-sm mt-1.5 cursor-pointer transition-opacity leading-none ${together ? 'opacity-100' : 'opacity-20 hover:opacity-60'}`}
            >💚</button>
          ) : (
            together && <span className="text-sm mt-1.5">💚</span>
          )}
        </div>

        {/* Zach */}
        <div className="flex-1 px-3 py-3.5 border-l border-cyan-100/60 bg-cyan-50/10 min-h-[56px]">
          <PersonEvents events={zachEvents} person="zach" onToggleKids={isReadOnly ? undefined : handleToggleKids} />
        </div>

        {/* Arianne */}
        <div className="flex-1 px-3 py-3.5 border-l border-purple-100/60 bg-purple-50/10 min-h-[56px]">
          <PersonEvents events={arianneEvents} person="arianne" onToggleKids={isReadOnly ? undefined : handleToggleKids} />
        </div>

        {/* Plans column — desktop only */}
        <div className="hidden md:flex w-40 flex-shrink-0 border-l border-gray-100 min-h-[56px] px-3 py-3.5 flex-col gap-1">
          {planEvents.map((plan, i) => (
            <PlanChip key={plan.id || i} plan={plan} onEdit={isReadOnly ? undefined : onEditEvent} />
          ))}
          {!isReadOnly && (
            <button
              onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr, 'plan'); }}
              className={`text-left text-xs text-gray-300 hover:text-indigo-400 cursor-pointer transition-colors ${planEvents.length > 0 ? 'mt-0.5' : ''}`}
            >
              {planEvents.length === 0 ? '+ plan' : '+ add'}
            </button>
          )}
        </div>

        {/* Travel column — desktop only */}
        <div className="hidden md:block w-44 flex-shrink-0 border-l border-gray-100 min-h-[56px] relative">
          {inlineOpen ? (
            <div className="p-2 bg-indigo-50/30">
              <InlineTravelAdd
                dateStr={dateStr}
                onSave={handleInlineSave}
                onCancel={() => setInlineOpen(false)}
              />
            </div>
          ) : (
            <div className="px-3 py-3.5 flex flex-col gap-1">
              {/* Existing entries — tap to see details, with popover */}
              {travelEvents.length > 0 && (
                <div className="flex flex-col">
                  {travelEvents.map((ev, i) => {
                    const evId = ev.id || i;
                    const isExpanded = expandedTravelId === evId;
                    return (
                      <div key={evId} className="relative">
                        <div
                          className={`cursor-pointer rounded -mx-1 px-1 transition-colors pb-1.5 mb-1.5 border-b border-gray-100 last:border-b-0 last:pb-0 last:mb-0 ${isExpanded ? 'bg-indigo-50/60' : 'hover:bg-indigo-50/40'}`}
                          onClick={e => { e.stopPropagation(); setExpandedTravelId(isExpanded ? null : evId); }}
                        >
                          {ev.type === 'flight' && <FlightDetail event={ev} />}
                          {ev.type === 'hotel'  && <HotelDetail  event={ev} dateStr={dateStr} />}
                        </div>
                        {isExpanded && (
                          <TravelPopover
                            event={ev}
                            dateStr={dateStr}
                            onEdit={onEditEvent}
                            onClose={() => setExpandedTravelId(null)}
                            onSaveEvent={onSaveEvent}
                            onDelete={isReadOnly ? undefined : onDeleteEvent}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Add button */}
              {!isReadOnly && (
                <button
                  onClick={e => { e.stopPropagation(); setInlineOpen(true); }}
                  className={`text-left text-xs text-gray-300 hover:text-indigo-400 cursor-pointer transition-colors ${travelEvents.length > 0 ? 'mt-1' : ''}`}
                >
                  {travelEvents.length === 0 ? '+ flight or hotel' : '+ add'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add */}
        {!isReadOnly && (
          <div className="w-8 flex-shrink-0 flex items-center justify-center border-l border-gray-100">
            <button
              onClick={e => { e.stopPropagation(); onAddEntry?.(dateStr); }}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-indigo-400 text-lg leading-none cursor-pointer transition-all"
              title="Add event"
            >+</button>
          </div>
        )}
      </div>

      {/* Mobile-only: Plans + Travel strip */}
      {(planEvents.length > 0 || travelEvents.length > 0) && (
        <div className="md:hidden border-t border-gray-50 bg-gray-50/40 px-4 py-2 flex flex-wrap gap-x-3 gap-y-1">
          {planEvents.map((plan, i) => (
            <button
              key={plan.id || i}
              onClick={e => { e.stopPropagation(); if (!isReadOnly) onEditEvent?.(plan); }}
              className="flex items-center gap-1 text-xs text-indigo-600 font-medium"
            >
              <span>{plan.category === 'restaurant' ? '🍽' : plan.category === 'kids' ? '⚽' : plan.category === 'event' ? '🎟' : '📅'}</span>
              <span>{plan.title}</span>
              {plan.time && <span className="text-gray-400">· {plan.time}</span>}
            </button>
          ))}
          {travelEvents.map((ev, i) => (
            <span key={ev.id || i} className="flex items-center gap-1 text-xs text-gray-600">
              <span>{ev.type === 'flight' ? '✈️' : '🏨'}</span>
              <span className="font-medium">{ev.type === 'flight' ? ev.flightNumber : (ev.hotelName || ev.city)}</span>
              {ev.type === 'flight' && ev.departureTime && <span className="text-gray-400">· {ev.departureTime}</span>}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <div className="border-t border-amber-100 bg-amber-50/50 px-4 py-2 flex flex-col gap-1">
          {notes.map((note, i) => (
            <div key={note.id || i} className="flex items-start gap-2">
              <span className="text-amber-400 text-xs mt-0.5 flex-shrink-0">📝</span>
              <p className="text-xs text-gray-600 leading-snug">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Month separator ───────────────────────────────────────────────────────────

function MonthHeader({ dateStr }) {
  return (
    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        {format(parseISO(dateStr), 'MMMM yyyy')}
      </span>
    </div>
  );
}

// ── Column header ─────────────────────────────────────────────────────────────

function ColumnHeader({ isReadOnly }) {
  return (
    <div className="flex border-b border-gray-200 bg-white sticky top-[53px] z-20 shadow-sm">
      <div className="w-24 flex-shrink-0 px-4 py-2.5" />
      <div className="flex-1 px-3 py-2.5 border-l border-cyan-100/70">
        <span className="text-sm font-bold text-cyan-600">Zach</span>
      </div>
      <div className="flex-1 px-3 py-2.5 border-l border-purple-100/70">
        <span className="text-sm font-bold text-purple-600">Arianne</span>
      </div>
      <div className="hidden md:block w-40 flex-shrink-0 px-3 py-2.5 border-l border-gray-100">
        <span className="text-xs font-semibold text-gray-400 tracking-wide">Plans</span>
      </div>
      <div className="hidden md:block w-44 flex-shrink-0 px-3 py-2.5 border-l border-gray-100">
        <span className="text-xs font-semibold text-gray-400 tracking-wide">Travel</span>
      </div>
      {!isReadOnly && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}

// ── Day builders ──────────────────────────────────────────────────────────────

function buildUpcomingDays(count = 120) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) =>
    format(addDays(today, i), 'yyyy-MM-dd')
  );
}

function buildPastDays(count = 180) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Most recent first (yesterday at top)
  return Array.from({ length: count }, (_, i) =>
    format(subDays(today, i + 1), 'yyyy-MM-dd')
  );
}

// ── Main ListView ─────────────────────────────────────────────────────────────

export function ListView({ events, onDayClick, onAddEntry, onSaveEvent, onEditEvent, onDeleteEvent, isReadOnly }) {
  const [showArchive, setShowArchive] = useState(false);

  const upcomingDays = useMemo(() => buildUpcomingDays(180), []);
  const pastDays     = useMemo(() => buildPastDays(180),    []);
  const days = showArchive ? pastDays : upcomingDays;

  let lastMonth = null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
      {/* Together stats + city summary — only in upcoming mode */}
      {!showArchive && (
        <>
          <TogetherStats events={events} upcomingDays={upcomingDays} />
          <CitySummary   events={events} upcomingDays={upcomingDays} />
        </>
      )}

      {/* Archive toggle */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {showArchive ? 'Past 6 months' : 'Upcoming 6 months'}
        </span>
        <button
          onClick={() => setShowArchive(v => !v)}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium cursor-pointer transition-colors"
        >
          {showArchive ? '← Upcoming' : 'Archive →'}
        </button>
      </div>

      {/* Calendar table */}
      <div className="rounded-xl border border-gray-100 shadow-sm bg-white">
        <ColumnHeader isReadOnly={isReadOnly} />
        <div>
          {days.map(dateStr => {
            const month = dateStr.slice(0, 7);
            const showMonthHeader = month !== lastMonth;
            lastMonth = month;

            return (
              <div key={dateStr}>
                {showMonthHeader && <MonthHeader dateStr={dateStr} />}
                <DayRow
                  dateStr={dateStr}
                  events={events}
                  onDayClick={onDayClick}
                  onAddEntry={onAddEntry}
                  onSaveEvent={onSaveEvent}
                  onEditEvent={onEditEvent}
                  onDeleteEvent={onDeleteEvent}
                  isReadOnly={isReadOnly}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
