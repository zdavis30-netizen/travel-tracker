import { Badge } from '../ui/Badge';
import { PERSON_COLORS } from '../../constants';

export function PersonCell({ person, events }) {
  const colors = PERSON_COLORS[person];
  const locationEvents = events.filter(e => e.type === 'location');
  const flightEvents = events.filter(e => e.type === 'flight');
  const hotelEvents = events.filter(e => e.type === 'hotel');
  const hasAny = events.length > 0;

  return (
    <div className={`flex-1 min-h-[52px] p-2 border-l ${colors.border}`}>
      {!hasAny ? (
        <span className="text-gray-300 text-xs">—</span>
      ) : (
        <div className="flex flex-col gap-1">
          {flightEvents.map(e => (
            <Badge key={e.id} type="flight">
              ✈ {e.flightNumber} · {e.fromCity || e.fromCode || '?'} → {e.toCity || e.toCode || '?'}
            </Badge>
          ))}
          {hotelEvents.map(e => (
            <Badge key={e.id} type="hotel">
              🏨 {e.city}
              {e.hotelName ? ` · ${e.hotelName}` : ''}
            </Badge>
          ))}
          {locationEvents.map(e => (
            <Badge key={e.id} type="location">
              📍 {e.city}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
