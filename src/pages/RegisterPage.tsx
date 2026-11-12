import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, organizationApi } from '../api/endpoints';
import type { Role } from '../api/types';
import { ErrorMessage } from '../components/Feedback';
import { affiliationRequiredFor, roleLabels, selfRegistrableRoles } from '../domain/roles';
import { useAction } from '../hooks/useAction';
import { useAsync } from '../hooks/useAsync';

const loadOrganization = () => Promise.all([organizationApi.faculties(), organizationApi.programs()]);

export function RegisterPage() {
  const navigate = useNavigate();
  const organization = useAsync(loadOrganization);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [programIds, setProgramIds] = useState<string[]>([]);
  const [facultyId, setFacultyId] = useState('');
  const { pending, error, run } = useAction();

  const requirement = affiliationRequiredFor(role);
  const [faculties, programs] = organization.data ?? [[], []];

  const toggleProgram = (programId: string) => {
    if (requirement === 'singleProgram') {
      setProgramIds([programId]);
      return;
    }
    setProgramIds((current) =>
      current.includes(programId) ? current.filter((id) => id !== programId) : [...current, programId],
    );
  };

  const changeRole = (nextRole: Role) => {
    setRole(nextRole);
    setProgramIds([]);
    setFacultyId('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const registered = await run(() =>
      authApi.register({
        fullName,
        email,
        phone,
        password,
        role,
        programIds: requirement === 'programs' || requirement === 'singleProgram' ? programIds : [],
        facultyId: requirement === 'faculty' ? facultyId : null,
      }),
    );
    if (registered) {
      navigate('/verificacion', { state: { email } });
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card wide" onSubmit={submit}>
        <h1>Solicitar registro</h1>
        <p className="muted">
          Tu cuenta quedará activa cuando verifiques correo y celular y la apruebe la persona responsable de tu rol.
        </p>
        <label>
          Nombre completo
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </label>
        <label>
          Correo institucional (@uco.edu.co)
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Celular
          <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="3001234567" required />
        </label>
        <label>
          Contraseña (mínimo 8 caracteres)
          <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
        </label>
        <label>
          Rol
          <select value={role} onChange={(event) => changeRole(event.target.value as Role)}>
            {selfRegistrableRoles.map((option) => (
              <option key={option} value={option}>
                {roleLabels[option]}
              </option>
            ))}
          </select>
        </label>

        {requirement === 'faculty' && (
          <label>
            Facultad que coordinarás
            <select value={facultyId} onChange={(event) => setFacultyId(event.target.value)} required>
              <option value="">Selecciona una facultad</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {(requirement === 'programs' || requirement === 'singleProgram') && (
          <fieldset>
            <legend>{requirement === 'singleProgram' ? 'Programa que coordinarás' : 'Programas a los que perteneces'}</legend>
            {programs.length === 0 && <p className="muted">Aún no hay programas registrados.</p>}
            {programs.map((program) => (
              <label key={program.id} className="checkbox">
                <input
                  type={requirement === 'singleProgram' ? 'radio' : 'checkbox'}
                  name="programs"
                  checked={programIds.includes(program.id)}
                  onChange={() => toggleProgram(program.id)}
                />
                {program.name}
              </label>
            ))}
          </fieldset>
        )}

        <ErrorMessage message={error ?? organization.error} />
        <button type="submit" disabled={pending}>
          Enviar solicitud
        </button>
        <p className="muted">
          <Link to="/login">Volver al ingreso</Link>
        </p>
      </form>
    </div>
  );
}
