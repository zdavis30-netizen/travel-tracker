import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { db, isFirebaseConfigured } from '../services/firebase';

const LS_KEY = 'travel_events';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveLocal(events) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(events)); } catch { /* ignore */ }
}

export function useEvents() {
  const [events, setEvents] = useState(() => isFirebaseConfigured ? [] : loadLocal());

  // ── Firebase: subscribe to real-time updates ──────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const eventsRef = ref(db, 'events');
    const unsub = onValue(eventsRef, snapshot => {
      const data = snapshot.val();
      if (!data) { setEvents([]); return; }
      setEvents(Object.entries(data).map(([fbId, val]) => ({ ...val, fbId })));
    });
    return () => unsub();
  }, []);

  // ── localStorage: persist on every change ────────────────────────────────
  useEffect(() => {
    if (isFirebaseConfigured) return;
    saveLocal(events);
  }, [events]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addEvent = useCallback((event) => {
    const newEvent = { ...event, id: event.id || crypto.randomUUID(), createdAt: event.createdAt || Date.now() };
    if (isFirebaseConfigured) {
      push(ref(db, 'events'), newEvent);
    } else {
      setEvents(prev => [...prev, newEvent]);
    }
    return newEvent;
  }, []);

  const updateEvent = useCallback((id, patch) => {
    if (isFirebaseConfigured) {
      setEvents(prev => {
        const event = prev.find(e => e.id === id);
        if (event?.fbId) update(ref(db, `events/${event.fbId}`), patch);
        return prev; // Firebase onValue will update state
      });
    } else {
      setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
    }
  }, []);

  const deleteEvent = useCallback((id) => {
    if (isFirebaseConfigured) {
      setEvents(prev => {
        const event = prev.find(e => e.id === id);
        if (event?.fbId) remove(ref(db, `events/${event.fbId}`));
        return prev; // Firebase onValue will update state
      });
    } else {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  }, []);

  return { events, addEvent, updateEvent, deleteEvent, isLive: isFirebaseConfigured };
}
