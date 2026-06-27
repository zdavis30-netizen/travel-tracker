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
    .map(h => ({ date: h.date, name: h.name }));
}
