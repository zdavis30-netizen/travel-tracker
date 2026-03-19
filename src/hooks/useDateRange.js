import { useState } from 'react';
import { addDays, startOfToday, format } from 'date-fns';

export function useDateRange(defaultDays = 90) {
  const today = startOfToday();
  const [start, setStart] = useState(format(today, 'yyyy-MM-dd'));
  const [end, setEnd] = useState(format(addDays(today, defaultDays), 'yyyy-MM-dd'));
  const [activePreset, setActivePreset] = useState(defaultDays);

  function setPreset(days) {
    const t = startOfToday();
    setStart(format(t, 'yyyy-MM-dd'));
    setEnd(format(addDays(t, days), 'yyyy-MM-dd'));
    setActivePreset(days);
  }

  function setCustomRange(newStart, newEnd) {
    setStart(newStart);
    setEnd(newEnd);
    setActivePreset(null);
  }

  return { start, end, activePreset, setPreset, setCustomRange };
}
