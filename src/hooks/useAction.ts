import { useCallback, useState } from 'react';
import { messageOf } from './messageOf';

/** Ejecuta una acción del usuario (enviar, aprobar, vetar) y expone su estado de envío y error. */
export function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<unknown>): Promise<boolean> => {
    setPending(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (failure) {
      setError(messageOf(failure));
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, error, run };
}
