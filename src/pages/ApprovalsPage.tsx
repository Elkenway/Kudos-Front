import { useState } from 'react';
import { approvalApi } from '../api/endpoints';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { TextForm } from '../components/TextForm';
import { formatDateTime } from '../domain/labels';
import { roleLabels } from '../domain/roles';
import { useAction } from '../hooks/useAction';
import { useAsync } from '../hooks/useAsync';

export function ApprovalsPage() {
  const pending = useAsync(approvalApi.pending);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const { pending: approving, error, run } = useAction();

  const approve = async (requestId: string) => {
    if (await run(() => approvalApi.approve(requestId))) {
      pending.reload();
    }
  };

  return (
    <section>
      <h1>Solicitudes de registro</h1>
      <p className="muted">Solo aparecen las solicitudes que te corresponde aprobar según tu rol y tu ámbito.</p>
      {pending.loading && <Loading />}
      <ErrorMessage message={pending.error ?? error} />
      {pending.data?.length === 0 && <EmptyState text="No hay solicitudes pendientes." />}
      <div className="stack">
        {pending.data?.map((request) => (
          <article key={request.requestId} className="card">
            <h2>{request.applicant.fullName}</h2>
            <dl className="details">
              <dt>Rol solicitado</dt>
              <dd>{roleLabels[request.requestedRole]}</dd>
              <dt>Correo</dt>
              <dd>
                {request.email} {request.emailVerified ? '(verificado)' : '(sin verificar)'}
              </dd>
              <dt>Celular</dt>
              <dd>
                {request.phone} {request.phoneVerified ? '(verificado)' : '(sin verificar)'}
              </dd>
              {request.requestedFaculty && (
                <>
                  <dt>Facultad</dt>
                  <dd>{request.requestedFaculty}</dd>
                </>
              )}
              {request.requestedPrograms.length > 0 && (
                <>
                  <dt>Programas</dt>
                  <dd>{request.requestedPrograms.join(', ')}</dd>
                </>
              )}
              <dt>Enviada</dt>
              <dd>{formatDateTime(request.submittedAt)}</dd>
            </dl>
            <div className="actions">
              <button type="button" disabled={approving} onClick={() => void approve(request.requestId)}>
                Aprobar
              </button>
              <button type="button" className="secondary" onClick={() => setRejectingId(request.requestId)}>
                Rechazar
              </button>
            </div>
            {rejectingId === request.requestId && (
              <TextForm
                label="Motivo del rechazo"
                submitLabel="Confirmar rechazo"
                onSubmit={(reason) => approvalApi.reject(request.requestId, reason)}
                onDone={() => {
                  setRejectingId(null);
                  pending.reload();
                }}
                onCancel={() => setRejectingId(null)}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
