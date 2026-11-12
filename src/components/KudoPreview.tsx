import { Link } from 'react-router-dom';
import type { KudoCard } from '../api/types';
import { formatDateTime } from '../domain/labels';
import { PersonLink } from './PersonLink';
import { StarRating } from './StarRating';
import { StatusBadge } from './StatusBadge';

/** Vista resumida para listados: el texto se recorta visualmente y el detalle muestra la conversación. */
export function KudoPreview({ kudo }: { kudo: KudoCard }) {
  return (
    <article className="card kudo-preview">
      <header className="kudo-header">
        <div>
          <PersonLink person={kudo.author} /> <span className="muted">reconoce a</span>{' '}
          <PersonLink person={kudo.recipient} />
        </div>
        <StatusBadge status={kudo.status} />
      </header>
      <p className="category-tag">{kudo.categoryName}</p>
      {kudo.body === null ? (
        <p className="muted">Este contenido fue vetado por moderación.</p>
      ) : (
        <p className="kudo-body clamped">{kudo.body}</p>
      )}
      <footer className="kudo-footer">
        <time dateTime={kudo.createdAt}>{formatDateTime(kudo.createdAt)}</time>
        <StarRating rating={kudo.rating} />
        <Link to={`/kudos/${kudo.id}`}>
          Ver completo · {kudo.replyCount} {kudo.replyCount === 1 ? 'réplica' : 'réplicas'}
        </Link>
      </footer>
    </article>
  );
}
