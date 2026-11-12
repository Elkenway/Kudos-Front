import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { profileApi } from '../api/endpoints';
import { ErrorMessage, Loading } from '../components/Feedback';
import { Pager } from '../components/Pager';
import { accountStatusLabels, formatDateTime } from '../domain/labels';
import { roleLabels } from '../domain/roles';
import { useAction } from '../hooks/useAction';
import { useAsync } from '../hooks/useAsync';

export function ProfilePage() {
  const profile = useAsync(profileApi.mine);
  const [activityPage, setActivityPage] = useState(0);
  const activity = useAsync(useCallback(() => profileApi.activity(activityPage), [activityPage]));
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const { pending, error, run } = useAction();

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.fullName);
      setEmail(profile.data.email);
      setPhone(profile.data.phone);
    }
  }, [profile.data]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    const contactChanged = email !== profile.data?.email || phone !== profile.data?.phone;
    if (await run(() => profileApi.update(fullName, email, phone))) {
      setNotice(
        contactChanged
          ? 'Datos guardados. Debes verificar el nuevo contacto para volver a usar la plataforma.'
          : 'Datos guardados.',
      );
      profile.reload();
    }
  };

  if (!profile.data) {
    return profile.loading ? <Loading /> : <ErrorMessage message={profile.error} />;
  }
  const view = profile.data;

  return (
    <section className="two-columns">
      <div className="card">
        <h1>Mi perfil</h1>
        <dl className="details">
          <dt>Rol</dt>
          <dd>{roleLabels[view.role]}</dd>
          <dt>Estado</dt>
          <dd>{accountStatusLabels[view.status]}</dd>
          {view.faculty && (
            <>
              <dt>Facultad</dt>
              <dd>{view.faculty}</dd>
            </>
          )}
          {view.programs.length > 0 && (
            <>
              <dt>Programas</dt>
              <dd>{view.programs.join(', ')}</dd>
            </>
          )}
          <dt>Registro</dt>
          <dd>{formatDateTime(view.registeredAt)}</dd>
        </dl>
        <form className="form" onSubmit={submit}>
          <h2>Información personal</h2>
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
          {notice && <p className="notice">{notice}</p>}
          <ErrorMessage message={error} />
          <button type="submit" disabled={pending}>
            Guardar cambios
          </button>
        </form>
      </div>
      <div className="card">
        <h2>Mi actividad</h2>
        <ErrorMessage message={activity.error} />
        <ul className="plain-list">
          {activity.data?.items.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.eventType}</strong> <span className="muted">{formatDateTime(entry.occurredOn)}</span>
            </li>
          ))}
        </ul>
        {activity.data && <Pager slice={activity.data} onPageChange={setActivityPage} />}
      </div>
    </section>
  );
}
