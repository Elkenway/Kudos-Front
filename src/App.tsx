import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireSession } from './auth/RequireSession';
import { Layout } from './components/Layout';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AuditPage } from './pages/AuditPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { FacultyPage } from './pages/FacultyPage';
import { FeedPage } from './pages/FeedPage';
import { KudoDetailPage } from './pages/KudoDetailPage';
import { LoginPage } from './pages/LoginPage';
import { ManagedAccountsPage } from './pages/ManagedAccountsPage';
import { ModerationPage } from './pages/ModerationPage';
import { NewKudoPage } from './pages/NewKudoPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PersonPage } from './pages/PersonPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProgramPage } from './pages/ProgramPage';
import { RegisterPage } from './pages/RegisterPage';
import { StructurePage } from './pages/StructurePage';
import { VerifyPage } from './pages/VerifyPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/verificacion" element={<VerifyPage />} />
      <Route element={<RequireSession />}>
        <Route element={<Layout />}>
          <Route index element={<FeedPage />} />
          <Route path="kudos/nuevo" element={<NewKudoPage />} />
          <Route path="kudos/:kudoId" element={<KudoDetailPage />} />
          <Route path="personas/:personId" element={<PersonPage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="notificaciones" element={<NotificationsPage />} />
          <Route path="estructura" element={<StructurePage />} />
          <Route path="facultades/:facultyId" element={<FacultyPage />} />
          <Route path="programas/:programId" element={<ProgramPage />} />
          <Route path="aprobaciones" element={<ApprovalsPage />} />
          <Route path="usuarios" element={<ManagedAccountsPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="moderacion" element={<ModerationPage />} />
          <Route path="auditoria" element={<AuditPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
