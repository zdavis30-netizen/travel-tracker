import { COLOR_MAP } from '../../constants';

export function Badge({ type, children, className = '' }) {
  const colors = COLOR_MAP[type] || COLOR_MAP.location;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      {children}
    </span>
  );
}
