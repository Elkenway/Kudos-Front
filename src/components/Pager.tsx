import type { PageSlice } from '../api/types';

interface PagerProps {
  slice: PageSlice<unknown>;
  onPageChange: (page: number) => void;
}

export function Pager({ slice, onPageChange }: PagerProps) {
  const totalPages = Math.max(1, Math.ceil(slice.totalItems / slice.size));
  if (totalPages === 1) {
    return null;
  }
  return (
    <nav className="pager" aria-label="Paginación">
      <button type="button" disabled={slice.page === 0} onClick={() => onPageChange(slice.page - 1)}>
        Anterior
      </button>
      <span>
        Página {slice.page + 1} de {totalPages}
      </span>
      <button type="button" disabled={slice.page + 1 >= totalPages} onClick={() => onPageChange(slice.page + 1)}>
        Siguiente
      </button>
    </nav>
  );
}
