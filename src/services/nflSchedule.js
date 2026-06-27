import { format } from 'date-fns';

const TEAMS = {
  bears:   { abbr: 'chi', label: 'Bears' },
  broncos: { abbr: 'den', label: 'Broncos' },
};

export async function fetchTeamSchedule(teamKey) {
  const team = TEAMS[teamKey];
  if (!team) return [];

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.abbr}/schedule`);
    if (!res.ok) return [];
    const json = await res.json();

    return (json.events || []).map(ev => {
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors || [];
      const self = competitors.find(c => c.team?.abbreviation?.toLowerCase() === team.abbr);
      const opp  = competitors.find(c => c.team?.abbreviation?.toLowerCase() !== team.abbr);
      if (!ev.date) return null;

      const localDate = new Date(ev.date);
      return {
        date:         format(localDate, 'yyyy-MM-dd'),
        time:         format(localDate, 'h:mm a'),
        timeValid:    comp?.timeValid !== false,
        team:         teamKey,
        teamLabel:    team.label,
        opponent:     opp?.team?.displayName    || '',
        opponentAbbr: opp?.team?.abbreviation   || '',
        homeAway:     self?.homeAway            || '',
        venue:        comp?.venue?.fullName     || '',
        completed:    !!comp?.status?.type?.completed,
      };
    }).filter(Boolean);
  } catch {
    return [];
  }
}

export async function fetchAllSchedules() {
  const [bears, broncos] = await Promise.all([
    fetchTeamSchedule('bears'),
    fetchTeamSchedule('broncos'),
  ]);
  return [...bears, ...broncos];
}
