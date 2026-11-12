import type { AccountStatus, ModerationStatus, ReportReason, ReportStatus } from '../api/types';

export const accountStatusLabels: Record<AccountStatus, string> = {
  PENDING_ACTIVATION: 'Pendiente de activación',
  ACTIVE: 'Activa',
  SUSPENDED: 'Suspendida',
  DEACTIVATED: 'Desactivada',
};

export const moderationStatusLabels: Record<ModerationStatus, string> = {
  CREATED: 'Creado',
  VISIBLE: 'Visible',
  REPORTED: 'Reportado',
  UNDER_REVIEW: 'En revisión',
  VETOED: 'Vetado',
};

export const reportReasonLabels: Record<ReportReason, string> = {
  OFFENSIVE_LANGUAGE: 'Lenguaje ofensivo',
  HARASSMENT: 'Acoso',
  DISCRIMINATION: 'Discriminación',
  SPAM: 'Spam',
  FALSE_INFORMATION: 'Información falsa',
  OTHER: 'Otro',
};

export const reportStatusLabels: Record<ReportStatus, string> = {
  PENDING: 'Pendiente',
  IN_REVIEW: 'En revisión',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
};

const dateTimeFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export function formatDateTime(isoInstant: string): string {
  return dateTimeFormat.format(new Date(isoInstant));
}
