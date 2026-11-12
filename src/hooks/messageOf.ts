export function messageOf(failure: unknown): string {
  return failure instanceof Error ? failure.message : 'Ocurrió un error inesperado';
}
