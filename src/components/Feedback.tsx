export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <p className="error-message" role="alert">
      {message}
    </p>
  );
}

export function Loading() {
  return <p className="muted">Cargando…</p>;
}

export function EmptyState({ text }: { text: string }) {
  return <p className="empty-state">{text}</p>;
}
