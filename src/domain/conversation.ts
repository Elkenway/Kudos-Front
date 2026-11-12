import type { ConversationItem } from '../api/types';

/**
 * La conversación llega aplanada en orden de lectura (preorden) con su profundidad. Una réplica se oculta
 * cuando alguno de sus ancestros está colapsado; como los descendientes siguen inmediatamente a su
 * ancestro, basta recordar la profundidad del colapso activo mientras se recorre la lista una vez.
 */
export function visibleConversation(items: ConversationItem[], collapsedIds: ReadonlySet<string>): ConversationItem[] {
  const visible: ConversationItem[] = [];
  let collapsedDepth: number | null = null;

  for (const item of items) {
    if (collapsedDepth !== null && item.depth > collapsedDepth) {
      continue;
    }
    collapsedDepth = collapsedIds.has(item.id) ? item.depth : null;
    visible.push(item);
  }
  return visible;
}

/**
 * Los descendientes de una réplica ocupan las posiciones entre ella y la siguiente réplica de igual o menor
 * profundidad. Con una pila de índices abiertos cada réplica entra y sale una sola vez: O(n).
 */
export function descendantCounts(items: ConversationItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  const openIndexes: number[] = [];
  const closeOpenRepliesDeeperOrEqualTo = (depth: number, endIndex: number) => {
    while (openIndexes.length > 0) {
      const openIndex = openIndexes[openIndexes.length - 1] as number;
      const openReply = items[openIndex] as ConversationItem;
      if (openReply.depth < depth) {
        return;
      }
      openIndexes.pop();
      counts.set(openReply.id, endIndex - openIndex - 1);
    }
  };

  items.forEach((item, index) => {
    closeOpenRepliesDeeperOrEqualTo(item.depth, index);
    openIndexes.push(index);
  });
  closeOpenRepliesDeeperOrEqualTo(0, items.length);
  return counts;
}

export const MAXIMUM_VISUAL_INDENTATION = 8;

export function indentationLevel(depth: number): number {
  return Math.min(depth, MAXIMUM_VISUAL_INDENTATION);
}
