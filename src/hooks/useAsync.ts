import { useCallback, useEffect, useState } from 'react';
import { messageOf } from './messageOf';

interface AsyncState<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
}

/**
 * Carga datos al montar y cada vez que cambia `load`. `load` debe ser estable: una función de módulo o una memorizada con useCallback
 * para que la carga se repita solo cuando cambian sus parámetros.
 */
export function useAsync<T>(load: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: null, loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let current = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    load()
      .then((data) => current && setState({ data, error: null, loading: false }))
      .catch((failure: unknown) => current && setState({ data: undefined, error: messageOf(failure), loading: false }));
    return () => {
      current = false;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((previous) => previous + 1), []);
  return { ...state, reload };
}
