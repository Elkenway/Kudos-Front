import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { organizationApi } from '../api/endpoints';
import { useSession } from '../auth/useAuth';
import { ErrorMessage, Loading } from '../components/Feedback';
import { PersonLink } from '../components/PersonLink';
import { TenureHistory } from '../components/TenureHistory';
import { TextForm } from '../components/TextForm';
import { canManageStructure } from '../domain/roles';
import { useAsync } from '../hooks/useAsync';

export function FacultyPage() {
  const { facultyId = '' } = useParams();
  const session = useSession();
  const faculty = useAsync(useCallback(() => organizationApi.faculty(facultyId), [facultyId]));
  const [renaming, setRenaming] = useState(false);

  if (!faculty.data) {
    return faculty.loading ? <Loading /> : <ErrorMessage message={faculty.error} />;
  }
  const detail = faculty.data;

  return (
    <section>
      <div className="page-header">
        <h1>{detail.name}</h1>
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
          onSubmit={(name) => organizationApi.renameFaculty(detail.id, name)}
          onDone={() => {
            setRenaming(false);
            faculty.reload();
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
          <h2>Programas</h2>
          <ul className="plain-list">
            {detail.programs.map((program) => (
              <li key={program.id}>
                <Link to={`/programas/${program.id}`}>{program.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
