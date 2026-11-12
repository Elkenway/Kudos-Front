import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ErrorMessage } from '../components/Feedback';
import { useAction } from '../hooks/useAction';

export function LoginPage() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { pending, error, run } = useAction();

  const destination = (location.state as { from?: string } | null)?.from ?? '/';
  if (session) {
    return <Navigate to={destination} replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await run(() => signIn(email, password))) {
      navigate(destination, { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>UCO Kudos</h1>
        <p className="muted">Reconocimiento entre la comunidad de la Universidad Católica de Oriente</p>
        <label>
          Correo institucional
          <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <ErrorMessage message={error} />
        <button type="submit" disabled={pending}>
          Ingresar
        </button>
        <p className="muted">
          ¿Aún no tienes cuenta? <Link to="/registro">Solicitar registro</Link> · <Link to="/verificacion">Verificar contacto</Link>
        </p>
      </form>
    </div>
  );
}
