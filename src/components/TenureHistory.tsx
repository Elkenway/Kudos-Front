import type { Tenure } from '../api/types';
import { formatDateTime } from '../domain/labels';
import { PersonLink } from './PersonLink';

export function TenureHistory({ history }: { history: Tenure[] }) {
  if (history.length === 0) {
    return <p className="muted">El cargo nunca ha sido ocupado.</p>;
  }
  return (
    <ol className="plain-list">
      {[...history].reverse().map((tenure) => (
        <li key={`${tenure.holder?.id ?? 'vacante'}-${tenure.startedAt}`}>
          <PersonLink person={tenure.holder} />
          <span className="muted">
            {' '}
            · desde {formatDateTime(tenure.startedAt)}
            {tenure.endedAt ? ` hasta ${formatDateTime(tenure.endedAt)}` : ' (actual)'}
          </span>
        </li>
      ))}
    </ol>
  );
}
