import { NavLink, Outlet } from 'react-router-dom';
import { useAuth, useSession } from '../auth/useAuth';
import {
  canConsultAudit,
  canManageCategories,
  canModerate,
  managesSomeone,
  roleLabels,
} from '../domain/roles';

interface NavigationEntry {
  to: string;
  label: string;
  visible: boolean;
}

export function Layout() {
  const session = useSession();
  const { signOut } = useAuth();
  const role = session.account.role;

  const navigation: NavigationEntry[] = [
    { to: '/', label: 'Muro', visible: true },
    { to: '/kudos/nuevo', label: 'Reconocer', visible: true },
    { to: `/personas/${session.account.id}`, label: 'Mis Kudos', visible: true },
    { to: '/notificaciones', label: 'Notificaciones', visible: true },
    { to: '/estructura', label: 'Estructura', visible: true },
    { to: '/aprobaciones', label: 'Aprobaciones', visible: managesSomeone(role) },
    { to: '/usuarios', label: 'Usuarios', visible: managesSomeone(role) },
    { to: '/categorias', label: 'Categorías', visible: canManageCategories(role) },
    { to: '/moderacion', label: 'Moderación', visible: canModerate(role) },
    { to: '/auditoria', label: 'Auditoría', visible: canConsultAudit(role) },
  ];

  return (
    <div className="app-shell">
      <header className="top-bar">
        <span className="brand">UCO Kudos</span>
        <nav aria-label="Principal">
          {navigation
            .filter((entry) => entry.visible)
            .map((entry) => (
              <NavLink key={entry.to} to={entry.to} end={entry.to === '/'}>
                {entry.label}
              </NavLink>
            ))}
        </nav>
        <div className="session-box">
          <NavLink to="/perfil">
            {session.account.fullName}
            <span className="muted"> · {roleLabels[role]}</span>
          </NavLink>
          <button type="button" className="secondary" onClick={signOut}>
            Salir
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
