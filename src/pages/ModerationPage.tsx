import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { moderationApi } from '../api/endpoints';
import type { ContentReference, ModerationOutcome, ReportStatus } from '../api/types';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { PersonLink } from '../components/PersonLink';
import { StatusBadge } from '../components/StatusBadge';
import { TextForm } from '../components/TextForm';
import { formatDateTime, reportReasonLabels, reportStatusLabels } from '../domain/labels';
import { useAction } from '../hooks/useAction';
import { useAsync } from '../hooks/useAsync';

const STATUS_FILTERS: (ReportStatus | '')[] = ['', 'PENDING', 'IN_REVIEW', 'ACCEPTED', 'REJECTED'];

type ClosingDecision = { content: ContentReference; outcome: ModerationOutcome } | null;

export function ModerationPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('PENDING');
  const reported = useAsync(useCallback(() => moderationApi.reportedContents(statusFilter || undefined), [statusFilter]));
  const decisions = useAsync(moderationApi.decisions);
  const [closing, setClosing] = useState<ClosingDecision>(null);
  const { pending, error, run } = useAction();

  const refresh = () => {
    reported.reload();
    decisions.reload();
  };

  const startReview = async (content: ContentReference) => {
    if (await run(() => moderationApi.startReview(content.type, content.id))) {
      refresh();
    }
  };

  return (
    <section>
      <h1>Moderación</h1>
      <label className="filter">
        Estado de los reportes
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ReportStatus | '')}>
          {STATUS_FILTERS.map((status) => (
            <option key={status || 'all'} value={status}>
              {status ? reportStatusLabels[status] : 'Todos'}
            </option>
          ))}
        </select>
      </label>
      {reported.loading && <Loading />}
      <ErrorMessage message={reported.error ?? error} />
      {reported.data?.length === 0 && <EmptyState text="No hay contenidos con reportes en este estado." />}
      <div className="stack">
        {reported.data?.map((item) => {
          const isSelected = closing?.content.id === item.content.id;
          return (
            <article key={item.content.id} className="card">
              <header className="kudo-header">
                <span>
                  {item.content.type === 'KUDO' ? 'Kudo' : 'Réplica'} de <PersonLink person={item.author} />
                </span>
                <StatusBadge status={item.contentStatus} />
              </header>
              <p className="kudo-body">{item.body}</p>
              <Link to={`/kudos/${item.kudoId}`}>Ver en contexto</Link>
              <ul className="plain-list">
                {item.reports.map((report) => (
                  <li key={report.id}>
                    <strong>{reportReasonLabels[report.reason]}</strong>
                    {report.detail && `: ${report.detail}`}
                    <span className="muted">
                      {' '}
                      · {report.reporter.fullName} · {formatDateTime(report.reportedAt)} · {reportStatusLabels[report.status]}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="actions">
                {item.contentStatus === 'REPORTED' && (
                  <button type="button" disabled={pending} onClick={() => void startReview(item.content)}>
                    Iniciar revisión
                  </button>
                )}
                {item.contentStatus === 'UNDER_REVIEW' && (
                  <>
                    <button type="button" className="danger" onClick={() => setClosing({ content: item.content, outcome: 'VETOED' })}>
                      Vetar
                    </button>
                    <button type="button" className="secondary" onClick={() => setClosing({ content: item.content, outcome: 'RELEASED' })}>
                      Liberar
                    </button>
                  </>
                )}
              </div>
              {isSelected && closing && (
                <TextForm
                  label={closing.outcome === 'VETOED' ? 'Justificación del veto' : 'Justificación de la liberación'}
                  submitLabel="Registrar decisión"
                  onSubmit={(rationale) => moderationApi.closeReview(closing.content.type, closing.content.id, closing.outcome, rationale)}
                  onDone={() => {
                    setClosing(null);
                    refresh();
                  }}
                  onCancel={() => setClosing(null)}
                />
              )}
            </article>
          );
        })}
      </div>

      <h2>Historial de decisiones</h2>
      <ErrorMessage message={decisions.error} />
      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Contenido</th>
            <th>Decisión</th>
            <th>Moderador</th>
            <th>Justificación</th>
            <th>Reportes resueltos</th>
          </tr>
        </thead>
        <tbody>
          {decisions.data?.map((decision) => (
            <tr key={decision.id}>
              <td>{formatDateTime(decision.decidedAt)}</td>
              <td>{decision.content.type === 'KUDO' ? 'Kudo' : 'Réplica'}</td>
              <td>{decision.outcome === 'VETOED' ? 'Vetado' : 'Liberado'}</td>
              <td>{decision.moderator.fullName}</td>
              <td>{decision.rationale}</td>
              <td>{decision.resolvedReports}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
