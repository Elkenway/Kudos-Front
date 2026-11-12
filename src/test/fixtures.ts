import type { ConversationItem, KudoCard, PageSlice, PersonSummary } from '../api/types';

export function person(overrides: Partial<PersonSummary> = {}): PersonSummary {
  return { id: 'persona-1', fullName: 'Laura Gómez', role: 'STUDENT', status: 'ACTIVE', ...overrides };
}

export function reply(id: string, depth: number, overrides: Partial<ConversationItem> = {}): ConversationItem {
  return {
    id,
    parentReplyId: null,
    depth,
    author: person({ id: `autor-${id}`, fullName: `Autor ${id}` }),
    body: `Réplica ${id}`,
    createdAt: '2026-11-01T15:00:00Z',
    status: 'VISIBLE',
    rating: { averageStars: 0, ratingCount: 0, myStars: null },
    ...overrides,
  };
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export function kudoCard(id: string, overrides: Partial<KudoCard> = {}): KudoCard {
  return {
    id,
    author: person({ id: 'autor', fullName: 'Andrés Ríos', role: 'TEACHER' }),
    recipient: person({ id: 'destinatario', fullName: 'Laura Gómez' }),
    categoryId: 'categoria-1',
    categoryName: 'Trabajo en equipo',
    body: `Gracias por todo ${id}`,
    createdAt: '2026-11-02T14:30:00Z',
    status: 'VISIBLE',
    rating: { averageStars: 0, ratingCount: 0, myStars: null },
    replyCount: 0,
    ...overrides,
  };
}

export function pageOf<T>(items: T[], page = 0, totalItems = items.length): PageSlice<T> {
  return { items, page, size: 10, totalItems };
}
