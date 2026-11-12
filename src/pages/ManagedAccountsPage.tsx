import { type FormEvent, useState } from 'react';
import { managementApi } from '../api/endpoints';
import type { Role } from '../api/types';
import { useSession } from '../auth/useAuth';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { PersonLink } from '../components/PersonLink';
import { TextForm } from '../components/TextForm';
import { accountStatusLabels } from '../domain/labels';
import { roleLabels, rolesManagedBy, selfRegistrableRoles } from '../domain/roles';
import { useAction } from '../hooks/useAction';
import { useAsync } from '../hooks/useAsync';

type PendingDecision = { accountId: string; kind: 'suspend' | 'deactivate' } | null;

export function ManagedAccountsPage() {
  const session = useSession();
  const accounts = useAsync(managementApi.manageable);
  const [decision, setDecision] = useState<PendingDecision>(null);
  const { pending, error, run } = useAction();
  const privilegedRoles = rolesManagedBy(session.account.role).filter((role) => !selfRegistrableRoles.includes(role));

  const reactivate = async (accountId: string) => {
    if (await run(() => managementApi.reactivate(accountId))) {
      accounts.reload();
    }
  };

  const finishDecision = () => {
    setDecision(null);
    accounts.reload();
  };

  return (
    <section>
      <h1>Usuarios a mi cargo</h1>
      {privilegedRoles.length > 0 && <PrivilegedRegistrationForm roles={privilegedRoles} onRegistered={accounts.reload} />}
      {accounts.loading && <Loading />}
      <ErrorMessage message={accounts.error ?? error} />
      {accounts.data?.length === 0 && <EmptyState text="No tienes usuarios a cargo." />}
      <table className="data-table">
        <thead>
          <tr>
            <th>Persona</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Contacto</th>
            <th>Vinculación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {accounts.data?.map(({ person, email, phone, affiliation }) => (
            <tr key={person.id}>
              <td>
                <PersonLink person={person} />
              </td>
              <td>{roleLabels[person.role]}</td>
              <td>{accountStatusLabels[person.status]}</td>
              <td>
                {email}
                <br />
                {phone}
              </td>
              <td>{affiliation}</td>
              <td>
                {person.status === 'ACTIVE' && (
                  <button type="button" className="link-button" onClick={() => setDecision({ accountId: person.id, kind: 'suspend' })}>
                    Suspender
                  </button>
                )}
                {person.status === 'SUSPENDED' && (
                  <button type="button" className="link-button" disabled={pending} onClick={() => void reactivate(person.id)}>
                    Reactivar
                  </button>
                )}
                {person.status !== 'DEACTIVATED' && (
                  <button
                    type="button"
                    className="link-button danger"
                    onClick={() => setDecision({ accountId: person.id, kind: 'deactivate' })}
                  >
                    Desactivar
                  </button>
                )}
                {decision?.accountId === person.id && (
                  <TextForm
                    label={decision.kind === 'suspend' ? 'Motivo de la suspensión' : 'Motivo de la desactivación'}
                    submitLabel="Confirmar"
                    onSubmit={(reason) =>
                      decision.kind === 'suspend'
                        ? managementApi.suspend(person.id, reason)
                        : managementApi.deactivate(person.id, reason)
                    }
                    onDone={finishDecision}
                    onCancel={() => setDecision(null)}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** Rector y Administrador no pueden autorregistrarse: los crea directamente quien los gestiona. */
function PrivilegedRegistrationForm({ roles, onRegistered }: { roles: Role[]; onRegistered: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(roles[0] ?? 'RECTOR');
  const [notice, setNotice] = useState<string | null>(null);
  const { pending, error, run } = useAction();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    if (await run(() => managementApi.registerPrivileged({ fullName, email, phone, password, role }))) {
      setNotice(`Cuenta creada. ${fullName} debe verificar su correo y su celular para activarla.`);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      onRegistered();
    }
  };

  return (
    <details className="card">
      <summary>Registrar {roles.map((option) => roleLabels[option]).join(' o ')}</summary>
      <form className="form" onSubmit={submit}>
        <label>
          Rol
          <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
            {roles.map((option) => (
              <option key={option} value={option}>
                {roleLabels[option]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nombre completo
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </label>
        <label>
          Correo institucional
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Celular
          <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
        </label>
        <label>
          Contraseña inicial
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        </label>
        {notice && <p className="notice">{notice}</p>}
        <ErrorMessage message={error} />
        <button type="submit" disabled={pending}>
          Registrar
        </button>
      </form>
    </details>
  );
}
