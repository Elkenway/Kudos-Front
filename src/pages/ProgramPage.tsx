import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { organizationApi } from '../api/endpoints';
import type { PersonSummary } from '../api/types';
import { useSession } from '../auth/useAuth';
import { ErrorMessage, Loading } from '../components/Feedback';
import { PersonLink } from '../components/PersonLink';
import { PersonPicker } from '../components/PersonPicker';
import { TenureHistory } from '../components/TenureHistory';
import { TextForm } from '../components/TextForm';
import { formatDateTime } from '../domain/labels';
import { canManageStructure, roleLabels } from '../domain/roles';
import { useAction } from '../hooks/useAction';
import { useAsync } from '../hooks/useAsync';

export function ProgramPage() {
  const { programId = '' } = useParams();
  const session = useSession();
  const program = useAsync(useCallback(() => organizationApi.program(programId), [programId]));
  const [renaming, setRenaming] = useState(false);
  const [candidate, setCandidate] = useState<PersonSummary | null>(null);
  const { pending, error, run } = useAction();

  if (!program.data) {
    return program.loading ? <Loading /> : <ErrorMessage message={program.error} />;
  }
  const detail = program.data;
  const coordinatesThisProgram = detail.coordinator?.id === session.account.id;
  const activeMembers = detail.members.filter((membership) => membership.unlinkedAt === null);
  const formerMembers = detail.members.filter((membership) => membership.unlinkedAt !== null);

  const link = async () => {
    if (candidate && (await run(() => organizationApi.linkMember(detail.id, candidate.id)))) {
      setCandidate(null);
      program.reload();
    }
  };

  const unlink = async (memberId: string) => {
    if (await run(() => organizationApi.unlinkMember(detail.id, memberId))) {
      program.reload();
    }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>{detail.name}</h1>
          <Link to={`/facultades/${detail.facultyId}`}>{detail.facultyName}</Link>
        </div>
        {canManageStructure(session.account.role) && !renaming && (
          <button type="button" className="secondary" onClick={() => setRenaming(true)}>
            Renombrar
          </button>
        )}
      </div>
      {renaming && (
        <TextForm
          label="Nuevo nombre"
          submitLabel="Guardar"
          multiline={false}
          onSubmit={(name) => organizationApi.renameProgram(detail.id, name)}
          onDone={() => {
            setRenaming(false);
            program.reload();
          }}
          onCancel={() => setRenaming(false)}
        />
      )}
      <div className="two-columns">
        <div className="card">
          <h2>Coordinación</h2>
          <p>
            Actual: <PersonLink person={detail.coordinator} />
          </p>
          <h3>Historia del cargo</h3>
          <TenureHistory history={detail.coordinatorHistory} />
        </div>
        <div className="card">
          <h2>Integrantes ({activeMembers.length})</h2>
          {coordinatesThisProgram && (
            <div className="inline-form">
              <span className="field-label">Vincular docente o estudiante</span>
              <PersonPicker selected={candidate} onSelect={setCandidate} />
              <button type="button" disabled={!candidate || pending} onClick={() => void link()}>
                Vincular
              </button>
            </div>
          )}
          <ErrorMessage message={error} />
          <ul className="plain-list">
            {activeMembers.map((membership) => (
              <li key={membership.member.id}>
                <PersonLink person={membership.member} />
                <span className="muted">
                  {' '}
                  · {roleLabels[membership.member.role]} desde {formatDateTime(membership.linkedAt)}
                </span>
                {coordinatesThisProgram && (
                  <button type="button" className="link-button danger" onClick={() => void unlink(membership.member.id)}>
                    Desvincular
                  </button>
                )}
              </li>
            ))}
          </ul>
          {formerMembers.length > 0 && (
            <details>
              <summary>Vinculaciones anteriores ({formerMembers.length})</summary>
              <ul className="plain-list">
                {formerMembers.map((membership) => (
                  <li key={`${membership.member.id}-${membership.linkedAt}`}>
                    {membership.member.fullName}
                    <span className="muted"> · hasta {formatDateTime(membership.unlinkedAt ?? membership.linkedAt)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}
