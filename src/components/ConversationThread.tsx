import { useMemo, useState } from 'react';
import { contentApi, kudoApi, moderationApi } from '../api/endpoints';
import type { ConversationItem } from '../api/types';
import { descendantCounts, indentationLevel, MAXIMUM_VISUAL_INDENTATION, visibleConversation } from '../domain/conversation';
import { formatDateTime } from '../domain/labels';
import { useAction } from '../hooks/useAction';
import { ErrorMessage } from './Feedback';
import { PersonLink } from './PersonLink';
import { ReportForm } from './ReportForm';
import { StarRating } from './StarRating';
import { StatusBadge } from './StatusBadge';
import { TextForm } from './TextForm';

interface ConversationThreadProps {
  items: ConversationItem[];
  viewerId: string;
  viewerCanModerate: boolean;
  onChanged: () => void;
}

type OpenPanel = { replyId: string; kind: 'reply' | 'report' | 'veto' } | null;

export function ConversationThread({ items, viewerId, viewerCanModerate, onChanged }: ConversationThreadProps) {
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(new Set());
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const rating = useAction();

  const visibleItems = useMemo(() => visibleConversation(items, collapsedIds), [items, collapsedIds]);
  const hiddenCounts = useMemo(() => descendantCounts(items), [items]);

  const toggleCollapsed = (replyId: string) => {
    setCollapsedIds((previous) => {
      const next = new Set(previous);
      if (next.has(replyId)) {
        next.delete(replyId);
      } else {
        next.add(replyId);
      }
      return next;
    });
  };

  const closePanelAndRefresh = () => {
    setOpenPanel(null);
    onChanged();
  };

  if (items.length === 0) {
    return <p className="muted">Aún no hay réplicas. Sé la primera persona en responder.</p>;
  }

  return (
    <div className="conversation">
      <ErrorMessage message={rating.error} />
      {visibleItems.map((item) => {
        const descendants = hiddenCounts.get(item.id) ?? 0;
        const collapsed = collapsedIds.has(item.id);
        const interactive = item.status !== 'VETOED';
        return (
          <article
            key={item.id}
            className="reply"
            style={{ marginLeft: `${indentationLevel(item.depth) * 1.25}rem` }}
            aria-label={`Réplica de ${item.author.fullName}`}
          >
            <header className="reply-header">
              <PersonLink person={item.author} />
              {item.depth > MAXIMUM_VISUAL_INDENTATION && <span className="muted">nivel {item.depth + 1}</span>}
              <time className="muted" dateTime={item.createdAt}>
                {formatDateTime(item.createdAt)}
              </time>
              <StatusBadge status={item.status} />
            </header>
            <p className="reply-body">{item.body ?? 'Esta réplica fue vetada por moderación.'}</p>
            <div className="reply-actions">
              <StarRating
                rating={item.rating}
                disabled={!interactive || rating.pending}
                onRate={(stars) => void rating.run(() => contentApi.rate('REPLY', item.id, stars)).then(onChanged)}
              />
              {interactive && (
                <button type="button" className="link-button" onClick={() => setOpenPanel({ replyId: item.id, kind: 'reply' })}>
                  Responder
                </button>
              )}
              {interactive && item.author.id !== viewerId && (
                <button type="button" className="link-button" onClick={() => setOpenPanel({ replyId: item.id, kind: 'report' })}>
                  Reportar
                </button>
              )}
              {interactive && viewerCanModerate && (
                <button type="button" className="link-button danger" onClick={() => setOpenPanel({ replyId: item.id, kind: 'veto' })}>
                  Vetar
                </button>
              )}
              {descendants > 0 && (
                <button type="button" className="link-button" aria-expanded={!collapsed} onClick={() => toggleCollapsed(item.id)}>
                  {collapsed ? `Mostrar ${descendants} ${descendants === 1 ? 'respuesta' : 'respuestas'}` : 'Ocultar respuestas'}
                </button>
              )}
            </div>
            {openPanel?.replyId === item.id && openPanel.kind === 'reply' && (
              <TextForm
                label="Tu respuesta"
                submitLabel="Publicar respuesta"
                onSubmit={(body) => kudoApi.replyToReply(item.id, body)}
                onDone={closePanelAndRefresh}
                onCancel={() => setOpenPanel(null)}
              />
            )}
            {openPanel?.replyId === item.id && openPanel.kind === 'report' && (
              <ReportForm
                contentType="REPLY"
                contentId={item.id}
                onReported={closePanelAndRefresh}
                onCancel={() => setOpenPanel(null)}
              />
            )}
            {openPanel?.replyId === item.id && openPanel.kind === 'veto' && (
              <TextForm
                label="Justificación del veto"
                submitLabel="Vetar réplica"
                onSubmit={(rationale) => moderationApi.veto('REPLY', item.id, rationale)}
                onDone={closePanelAndRefresh}
                onCancel={() => setOpenPanel(null)}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
