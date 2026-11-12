import type { ModerationStatus } from '../api/types';
import { moderationStatusLabels } from '../domain/labels';

export function StatusBadge({ status }: { status: ModerationStatus }) {
  if (status === 'VISIBLE') {
    return null;
  }
  return <span className={`badge badge-${status.toLowerCase()}`}>{moderationStatusLabels[status]}</span>;
}
