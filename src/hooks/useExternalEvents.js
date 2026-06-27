import { useState, useEffect } from 'react';
import { fetchHolidays } from '../services/holidays';
import { fetchAllSchedules } from '../services/nflSchedule';

export function useExternalEvents() {
  const [holidays, setHolidays] = useState({}); // date -> name
  const [games,    setGames]    = useState({}); // date -> [game, ...]

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
  }, []);

  return { holidays, games };
}
