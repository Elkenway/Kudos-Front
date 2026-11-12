import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('indica cuando el contenido aún no tiene calificaciones', () => {
    render(<StarRating rating={{ averageStars: 0, ratingCount: 0, myStars: null }} />);

    expect(screen.getByText('Sin calificaciones')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('muestra el promedio con un decimal y la cantidad de calificaciones', () => {
    render(<StarRating rating={{ averageStars: 4.333, ratingCount: 3, myStars: null }} />);

    expect(screen.getByText('4.3 de 5 (3 calificaciones)')).toBeInTheDocument();
  });

  it('marca la calificación propia y notifica la nueva elección', async () => {
    const onRate = vi.fn();
    render(<StarRating rating={{ averageStars: 4, ratingCount: 1, myStars: 4 }} onRate={onRate} />);

    expect(screen.getByRole('button', { name: 'Calificar con 4 estrellas' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Calificar con 2 estrellas' }));

    expect(onRate).toHaveBeenCalledWith(2);
  });

  it('no permite calificar cuando está deshabilitado', async () => {
    const onRate = vi.fn();
    render(<StarRating rating={{ averageStars: 5, ratingCount: 1, myStars: null }} onRate={onRate} disabled />);

    await userEvent.click(screen.getByRole('button', { name: 'Calificar con 1 estrella' }));

    expect(onRate).not.toHaveBeenCalled();
  });
});
