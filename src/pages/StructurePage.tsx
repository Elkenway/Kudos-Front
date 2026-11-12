import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { organizationApi } from '../api/endpoints';
import { useSession } from '../auth/useAuth';
import { ErrorMessage, Loading } from '../components/Feedback';
import { PersonLink } from '../components/PersonLink';
import { TextForm } from '../components/TextForm';
import { canManageStructure, roleLabels } from '../domain/roles';
import { useAction } from '../hooks/useAction';
import { useAsync } from '../hooks/useAsync';

const loadStructure = () =>
  Promise.all([organizationApi.faculties(), organizationApi.programs(), organizationApi.universityAuthorities()]);

export function StructurePage() {
  const session = useSession();
  const structure = useAsync(loadStructure);
  const manager = canManageStructure(session.account.role);

  if (!structure.data) {
    return structure.loading ? <Loading /> : <ErrorMessage message={structure.error} />;
  }
  const [faculties, programs, authorities] = structure.data;

  return (
    <section>
      <h1>Estructura institucional</h1>
      <div className="card">
        <h2>Autoridades universitarias</h2>
        <ul className="plain-list">
          {authorities.map((authority) => (
            <li key={authority.position}>
              <strong>{roleLabels[authority.position]}:</strong> <PersonLink person={authority.currentHolder} />
              <span className="muted"> · {authority.history.length} en la historia del cargo</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="two-columns">
        <div className="card">
          <h2>Facultades</h2>
          {manager && (
            <TextForm
              label="Nueva facultad"
              submitLabel="Crear facultad"
              multiline={false}
              onSubmit={organizationApi.createFaculty}
              onDone={structure.reload}
            />
          )}
          <ul className="plain-list">
            {faculties.map((faculty) => (
              <li key={faculty.id}>
                <Link to={`/facultades/${faculty.id}`}>{faculty.name}</Link>
                <span className="muted">
                  {' '}
                  · {faculty.programCount} programas · Coordinación: {faculty.coordinator?.fullName ?? 'sin asignar'}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2>Programas académicos</h2>
          {manager && faculties.length > 0 && (
            <NewProgramForm facultyOptions={faculties} onCreated={structure.reload} />
          )}
          <ul className="plain-list">
            {programs.map((program) => (
              <li key={program.id}>
                <Link to={`/programas/${program.id}`}>{program.name}</Link>
                <span className="muted"> · Coordinación: {program.coordinator?.fullName ?? 'sin asignar'}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function NewProgramForm({ facultyOptions, onCreated }: { facultyOptions: { id: string; name: string }[]; onCreated: () => void }) {
  const [facultyId, setFacultyId] = useState(facultyOptions[0]?.id ?? '');
  const [name, setName] = useState('');
  const { pending, error, run } = useAction();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await run(() => organizationApi.createProgram(facultyId, name))) {
      setName('');
      onCreated();
    }
  };

  return (
    <form className="inline-form" onSubmit={submit}>
      <label>
        Facultad
        <select value={facultyId} onChange={(event) => setFacultyId(event.target.value)}>
          {facultyOptions.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Nuevo programa
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <ErrorMessage message={error} />
      <button type="submit" disabled={pending || name.trim() === ''}>
        Crear programa
      </button>
    </form>
  );
}
