import { type FormEvent, useCallback, useState } from 'react';
import { type AuditFilters, auditApi } from '../api/endpoints';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { Pager } from '../components/Pager';
import { formatDateTime } from '../domain/labels';
import { useAsync } from '../hooks/useAsync';

export function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [draft, setDraft] = useState<AuditFilters>({});
  const [page, setPage] = useState(0);
  const entries = useAsync(useCallback(() => auditApi.search(filters, page), [filters, page]));

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    setPage(0);
    setFilters(draft);
  };

  return (
    <section>
      <h1>Auditoría institucional</h1>
      <form className="card filter-form" onSubmit={applyFilters}>
        <label>
          Tipo de evento
          <input
            value={draft.eventType ?? ''}
            onChange={(event) => setDraft({ ...draft, eventType: event.target.value })}
            placeholder="KudoPublished"
          />
        </label>
        <label>
          Identificador de quien actuó
          <input value={draft.actorId ?? ''} onChange={(event) => setDraft({ ...draft, actorId: event.target.value })} />
        </label>
        <label>
          Identificador del objeto afectado
          <input value={draft.aggregateId ?? ''} onChange={(event) => setDraft({ ...draft, aggregateId: event.target.value })} />
        </label>
        <button type="submit">Filtrar</button>
      </form>
      {entries.loading && <Loading />}
      <ErrorMessage message={entries.error} />
      {entries.data?.items.length === 0 && <EmptyState text="No hay registros con esos filtros." />}
      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Evento</th>
            <th>Quien actuó</th>
            <th>Objeto afectado</th>
            <th>Evidencia</th>
          </tr>
        </thead>
        <tbody>
          {entries.data?.items.map((entry) => (
            <tr key={entry.id}>
              <td>{formatDateTime(entry.occurredOn)}</td>
              <td>{entry.eventType}</td>
              <td className="mono">{entry.actorId ?? 'Sistema'}</td>
              <td className="mono">{entry.aggregateId}</td>
              <td>
                <details>
                  <summary>Ver</summary>
                  <pre className="evidence">{JSON.stringify(JSON.parse(entry.evidence), null, 2)}</pre>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.data && <Pager slice={entries.data} onPageChange={setPage} />}
    </section>
  );
}
