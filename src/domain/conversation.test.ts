import { reply } from '../test/fixtures';
import { descendantCounts, indentationLevel, MAXIMUM_VISUAL_INDENTATION, visibleConversation } from './conversation';

/*
 * a
 * ├─ b
 * │  └─ c
 * └─ d
 * e
 */
const conversation = [reply('a', 0), reply('b', 1), reply('c', 2), reply('d', 1), reply('e', 0)];
const idsOf = (items: { id: string }[]) => items.map((item) => item.id);

describe('visibleConversation', () => {
  it('muestra todas las réplicas cuando nada está colapsado', () => {
    expect(idsOf(visibleConversation(conversation, new Set()))).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('oculta solo los descendientes de la réplica colapsada', () => {
    expect(idsOf(visibleConversation(conversation, new Set(['b'])))).toEqual(['a', 'b', 'd', 'e']);
  });

  it('oculta toda la rama cuando se colapsa la raíz', () => {
    expect(idsOf(visibleConversation(conversation, new Set(['a'])))).toEqual(['a', 'e']);
  });

  it('un colapso interno no reaparece al colapsar también a su ancestro', () => {
    expect(idsOf(visibleConversation(conversation, new Set(['a', 'b'])))).toEqual(['a', 'e']);
  });
});

describe('descendantCounts', () => {
  it('cuenta los descendientes directos e indirectos de cada réplica', () => {
    const counts = descendantCounts(conversation);

    expect(Object.fromEntries(counts)).toEqual({ a: 3, b: 1, c: 0, d: 0, e: 0 });
  });

  it('devuelve un mapa vacío para una conversación sin réplicas', () => {
    expect(descendantCounts([]).size).toBe(0);
  });
});

describe('indentationLevel', () => {
  it('respeta la profundidad hasta el máximo visual', () => {
    expect(indentationLevel(3)).toBe(3);
    expect(indentationLevel(40)).toBe(MAXIMUM_VISUAL_INDENTATION);
  });
});
