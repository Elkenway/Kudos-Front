import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { contentApi, kudoApi, moderationApi } from '../api/endpoints';
import { useSession } from '../auth/useAuth';
import { ConversationThread } from '../components/ConversationThread';
import { ErrorMessage, Loading } from '../components/Feedback';
import { PersonLink } from '../components/PersonLink';
import { ReportForm } from '../components/ReportForm';
import { StarRating } from '../components/StarRating';
import { StatusBadge } from '../components/StatusBadge';
import { TextForm } from '../components/TextForm';
import { formatDateTime } from '../domain/labels';
import { canModerate } from '../domain/roles';
import { useAction } from '../hooks/useAction';
import { useAsync } from '../hooks/useAsync';

type KudoPanel = 'report' | 'veto' | null;

export function KudoDetailPage() {
  const { kudoId = '' } = useParams();
  const session = useSession();
  const detail = useAsync(useCallback(() => kudoApi.detail(kudoId), [kudoId]));
  const [panel, setPanel] = useState<KudoPanel>(null);
  const rating = useAction();
  const viewerCanModerate = canModerate(session.account.role);

  if (detail.loading && !detail.data) {
    return <Loading />;
  }
  if (!detail.data) {
    return <ErrorMessage message={detail.error} />;
  }

  const { kudo, conversation } = detail.data;
  const interactive = kudo.status !== 'VETOED';
  const closePanelAndRefresh = () => {
    setPanel(null);
    detail.reload();
  };

  return (
    <section>
      <article className="card kudo-detail">
        <header className="kudo-header">
          <div>
            <PersonLink person={kudo.author} showRole /> <span className="muted">reconoce a</span>{' '}
            <PersonLink person={kudo.recipient} showRole />
          </div>
          <StatusBadge status={kudo.status} />
        </header>
        <p className="category-tag">{kudo.categoryName}</p>
        <p className="kudo-body">{kudo.body ?? 'Este Kudo fue vetado por moderación.'}</p>
        <footer className="kudo-footer">
          <time dateTime={kudo.createdAt}>{formatDateTime(kudo.createdAt)}</time>
          <StarRating
            rating={kudo.rating}
            disabled={!interactive || rating.pending}
            onRate={(stars) => void rating.run(() => contentApi.rate('KUDO', kudo.id, stars)).then(detail.reload)}
          />
          {interactive && kudo.author.id !== session.account.id && (
            <button type="button" className="link-button" onClick={() => setPanel('report')}>
              Reportar
            </button>
          )}
          {interactive && viewerCanModerate && (
            <button type="button" className="link-button danger" onClick={() => setPanel('veto')}>
              Vetar
            </button>
          )}
        </footer>
        <ErrorMessage message={rating.error} />
        {panel === 'report' && (
          <ReportForm contentType="KUDO" contentId={kudo.id} onReported={closePanelAndRefresh} onCancel={() => setPanel(null)} />
        )}
        {panel === 'veto' && (
          <TextForm
            label="Justificación del veto"
            submitLabel="Vetar Kudo"
            onSubmit={(rationale) => moderationApi.veto('KUDO', kudo.id, rationale)}
            onDone={closePanelAndRefresh}
            onCancel={() => setPanel(null)}
          />
        )}
      </article>

      <h2>Conversación</h2>
      {interactive && (
        <TextForm
          label="Responder al Kudo"
          submitLabel="Publicar réplica"
          onSubmit={(body) => kudoApi.replyToKudo(kudo.id, body)}
          onDone={detail.reload}
        />
      )}
      <ConversationThread
        items={conversation}
        viewerId={session.account.id}
        viewerCanModerate={viewerCanModerate}
        onChanged={detail.reload}
      />
    </section>
  );
}
