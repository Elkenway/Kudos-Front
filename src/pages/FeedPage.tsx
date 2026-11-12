import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { kudoApi } from '../api/endpoints';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { KudoPreview } from '../components/KudoPreview';
import { Pager } from '../components/Pager';
import { useAsync } from '../hooks/useAsync';

export function FeedPage() {
  const [page, setPage] = useState(0);
  const feed = useAsync(useCallback(() => kudoApi.feed(page), [page]));

  return (
    <section>
      <div className="page-header">
        <h1>Muro de reconocimientos</h1>
        <Link className="button" to="/kudos/nuevo">
          Reconocer a alguien
        </Link>
      </div>
      {feed.loading && <Loading />}
      <ErrorMessage message={feed.error} />
      {feed.data && feed.data.items.length === 0 && <EmptyState text="Todavía no hay Kudos publicados." />}
      <div className="stack">
        {feed.data?.items.map((kudo) => <KudoPreview key={kudo.id} kudo={kudo} />)}
      </div>
      {feed.data && <Pager slice={feed.data} onPageChange={setPage} />}
    </section>
  );
}
