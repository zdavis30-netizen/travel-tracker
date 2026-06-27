// Nager.Date returns the federally-observed date (shifted off weekends),
// not the actual calendar date. For these fixed-date holidays, show the
// real date instead — e.g. July 4 even when offices observe it on July 3.
const FIXED_DATE_HOLIDAYS = {
  "New Year's Day":   '01-01',
  'Juneteenth National Independence Day': '06-19',
  'Independence Day': '07-04',
  'Veterans Day':     '11-11',
  'Christmas Day':    '12-25',
};

export async function fetchHolidays(years) {
  const results = await Promise.all(
    years.map(year =>
      fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`)
        .then(r => (r.ok ? r.json() : []))
        .catch(() => [])
    )
  );

  return results
    .flat()
    .filter(h => h.types?.includes('Public'))
    .map(h => {
      const fixed = FIXED_DATE_HOLIDAYS[h.name];
      const date = fixed ? `${h.date.slice(0, 4)}-${fixed}` : h.date;
      return { date, name: h.name };
    });
}
