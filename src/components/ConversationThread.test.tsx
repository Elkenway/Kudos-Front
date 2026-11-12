import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { routerFutureFlags } from '../routerFutureFlags';
import type { ConversationItem } from '../api/types';
import { reply } from '../test/fixtures';
import { ConversationThread } from './ConversationThread';

function renderThread(items: ConversationItem[], viewerCanModerate = false) {
  render(
    <MemoryRouter future={routerFutureFlags}>
      <ConversationThread items={items} viewerId="autor-a" viewerCanModerate={viewerCanModerate} onChanged={vi.fn()} />
    </MemoryRouter>,
  );
}

describe('ConversationThread', () => {
  it('invita a responder cuando no hay réplicas', () => {
    renderThread([]);

    expect(screen.getByText(/Aún no hay réplicas/)).toBeInTheDocument();
  });

  it('colapsa y expande las respuestas de una réplica', async () => {
    renderThread([reply('a', 0), reply('b', 1), reply('c', 2), reply('d', 0)]);

    await userEvent.click(screen.getAllByRole('button', { name: 'Ocultar respuestas' })[0] as HTMLElement);

    expect(screen.queryByText('Réplica b')).not.toBeInTheDocument();
    expect(screen.queryByText('Réplica c')).not.toBeInTheDocument();
    expect(screen.getByText('Réplica d')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar 2 respuestas' }));

    expect(screen.getByText('Réplica c')).toBeInTheDocument();
  });

  it('no ofrece reportar las réplicas propias ni actuar sobre las vetadas', () => {
    renderThread([reply('a', 0), reply('v', 0, { status: 'VETOED', body: null })], true);

    const ownReply = screen.getByRole('article', { name: 'Réplica de Autor a' });
    const vetoedReply = screen.getByRole('article', { name: 'Réplica de Autor v' });

    expect(ownReply).not.toHaveTextContent('Reportar');
    expect(ownReply).toHaveTextContent('Vetar');
    expect(vetoedReply).toHaveTextContent('Esta réplica fue vetada por moderación.');
    expect(vetoedReply).not.toHaveTextContent('Responder');
  });

  it('abre el formulario de respuesta bajo la réplica elegida', async () => {
    renderThread([reply('a', 0), reply('b', 0)]);

    await userEvent.click(screen.getAllByRole('button', { name: 'Responder' })[1] as HTMLElement);

    expect(screen.getByLabelText('Tu respuesta')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Réplica de Autor b' })).toContainElement(screen.getByLabelText('Tu respuesta'));
  });
});
