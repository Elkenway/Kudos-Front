import type { RatingInfo } from '../api/types';

const STAR_SCALE = [1, 2, 3, 4, 5];

interface StarRatingProps {
  rating: RatingInfo;
  disabled?: boolean;
  onRate?: (stars: number) => void;
}

export function StarRating({ rating, disabled = false, onRate }: StarRatingProps) {
  const summary =
    rating.ratingCount === 0
      ? 'Sin calificaciones'
      : `${rating.averageStars.toFixed(1)} de 5 (${rating.ratingCount} ${rating.ratingCount === 1 ? 'calificación' : 'calificaciones'})`;

  return (
    <div className="star-rating">
      {onRate && (
        <div className="stars" role="group" aria-label="Tu calificación">
          {STAR_SCALE.map((stars) => (
            <button
              key={stars}
              type="button"
              className={rating.myStars !== null && stars <= rating.myStars ? 'star selected' : 'star'}
              aria-label={`Calificar con ${stars} ${stars === 1 ? 'estrella' : 'estrellas'}`}
              aria-pressed={rating.myStars === stars}
              disabled={disabled}
              onClick={() => onRate(stars)}
            >
              ★
            </button>
          ))}
        </div>
      )}
      <span className="muted">{summary}</span>
    </div>
  );
}
