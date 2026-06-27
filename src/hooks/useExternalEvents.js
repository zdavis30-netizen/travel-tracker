import { useState, useEffect } from 'react';
import { fetchHolidays } from '../services/holidays';
import { fetchAllSchedules } from '../services/nflSchedule';
import { getBirthdaysForYears } from '../services/birthdays';

export function useExternalEvents() {
  const [holidays,  setHolidays]  = useState({}); // date -> name
  const [games,     setGames]     = useState({}); // date -> [game, ...]
  const [birthdays, setBirthdays] = useState({}); // date -> [birthday, ...]

  useEffect(() => {
    const thisYear = new Date().getFullYear();

    fetchHolidays([thisYear, thisYear + 1]).then(list => {
      const map = {};
      list.forEach(h => { if (!map[h.date]) map[h.date] = h.name; });
      setHolidays(map);
    });

    fetchAllSchedules().then(list => {
      const map = {};
      list.forEach(g => {
        if (!map[g.date]) map[g.date] = [];
        map[g.date].push(g);
      });
      setGames(map);
    });

    const map = {};
    getBirthdaysForYears([thisYear, thisYear + 1]).forEach(b => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    setBirthdays(map);
  }, []);

  return { holidays, games, birthdays };
}
