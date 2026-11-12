import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { kudoApi, peopleApi } from '../api/endpoints';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { KudoPreview } from '../components/KudoPreview';
import { Pager } from '../components/Pager';
import { accountStatusLabels } from '../domain/labels';
import { roleLabels } from '../domain/roles';
import { useAsync } from '../hooks/useAsync';

type KudoDirection = 'received' | 'authored';

export function PersonPage() {
  const { personId = '' } = useParams();
  const [direction, setDirection] = useState<KudoDirection>('received');
  const [page, setPage] = useState(0);
  const affiliation = useAsync(useCallback(() => peopleApi.affiliation(personId), [personId]));
  const kudos = useAsync(
    useCallback(
      () => (direction === 'received' ? kudoApi.receivedBy(personId, page) : kudoApi.authoredBy(personId, page)),
      [direction, personId, page],
    ),
  );

  const changeDirection = (next: KudoDirection) => {
    setDirection(next);
    setPage(0);
  };

  const person = affiliation.data?.person;
  return (
    <section>
      {affiliation.loading && <Loading />}
      <ErrorMessage message={affiliation.error} />
      {person && affiliation.data && (
        <header className="card person-header">
          <h1>{person.fullName}</h1>
          <p>
            {roleLabels[person.role]} · {accountStatusLabels[person.status]}
          </p>
          {affiliation.data.faculty && <p className="muted">Facultad: {affiliation.data.faculty}</p>}
          {affiliation.data.programs.length > 0 && (
            <p className="muted">Programas: {affiliation.data.programs.map((program) => program.name).join(', ')}</p>
          )}
        </header>
      )}
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={direction === 'received'} onClick={() => changeDirection('received')}>
          Recibidos
        </button>
        <button type="button" role="tab" aria-selected={direction === 'authored'} onClick={() => changeDirection('authored')}>
          Enviados
        </button>
      </div>
      <ErrorMessage message={kudos.error} />
      {kudos.data && kudos.data.items.length === 0 && <EmptyState text="No hay Kudos en esta lista." />}
      <div className="stack">
        {kudos.data?.items.map((kudo) => <KudoPreview key={kudo.id} kudo={kudo} />)}
      </div>
      {kudos.data && <Pager slice={kudos.data} onPageChange={setPage} />}
    </section>
  );
}
