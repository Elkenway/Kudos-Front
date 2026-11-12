import { type FormEvent, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import type { VerificationStatus } from '../api/types';
import { ErrorMessage } from '../components/Feedback';
import { accountStatusLabels } from '../domain/labels';
import { useAction } from '../hooks/useAction';

export function VerifyPage() {
  const location = useLocation();
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? '');
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { pending, error, run } = useAction();

  const verify = (channel: 'email' | 'phone') => async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    await run(async () => {
      const result =
        channel === 'email' ? await authApi.verifyEmail(email, emailCode) : await authApi.verifyPhone(email, phoneCode);
      setStatus(result);
    });
  };

  const reissue = async () => {
    if (await run(() => authApi.reissueCodes(email))) {
      setNotice('Enviamos nuevos códigos a los contactos que faltan por verificar.');
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Verificar contacto</h1>
        <p className="muted">Ingresa los códigos de 6 dígitos enviados a tu correo y a tu celular.</p>
        <label>
          Correo institucional
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <form className="inline-form" onSubmit={verify('email')}>
          <label>
            Código del correo
            <input inputMode="numeric" value={emailCode} onChange={(event) => setEmailCode(event.target.value)} required />
          </label>
          <button type="submit" disabled={pending || status?.emailVerified}>
            {status?.emailVerified ? 'Correo verificado' : 'Verificar correo'}
          </button>
        </form>
        <form className="inline-form" onSubmit={verify('phone')}>
          <label>
            Código del celular
            <input inputMode="numeric" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)} required />
          </label>
          <button type="submit" disabled={pending || status?.phoneVerified}>
            {status?.phoneVerified ? 'Celular verificado' : 'Verificar celular'}
          </button>
        </form>
        {status && (
          <p className="notice" role="status">
            Estado de la cuenta: {accountStatusLabels[status.status]}
            {!status.approved && ' · pendiente de aprobación institucional'}
          </p>
        )}
        {notice && <p className="notice">{notice}</p>}
        <ErrorMessage message={error} />
        <div className="actions">
          <button type="button" className="secondary" disabled={pending || email === ''} onClick={reissue}>
            Reenviar códigos
          </button>
          <Link to="/login">Ir al ingreso</Link>
        </div>
      </div>
    </div>
  );
}
