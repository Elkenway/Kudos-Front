import { Link } from 'react-router-dom';
import type { PersonSummary } from '../api/types';
import { roleLabels } from '../domain/roles';

export function PersonLink({ person, showRole = false }: { person: PersonSummary | null; showRole?: boolean }) {
  if (!person) {
    return <span className="muted">Sin asignar</span>;
  }
  return (
    <Link to={`/personas/${person.id}`} className="person-link">
      {person.fullName}
      {showRole && <span className="muted"> · {roleLabels[person.role]}</span>}
    </Link>
  );
}
