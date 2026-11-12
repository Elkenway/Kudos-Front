import { type FormEvent, useState } from 'react';
import { useAction } from '../hooks/useAction';
import { ErrorMessage } from './Feedback';

interface TextFormProps {
  label: string;
  submitLabel: string;
  onSubmit: (text: string) => Promise<unknown>;
  onDone?: () => void;
  onCancel?: () => void;
  multiline?: boolean;
}

/** Formulario de un solo campo de texto: réplicas, motivos de rechazo, justificaciones de veto, nombres. */
export function TextForm({ label, submitLabel, onSubmit, onDone, onCancel, multiline = true }: TextFormProps) {
  const [text, setText] = useState('');
  const { pending, error, run } = useAction();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await run(() => onSubmit(text))) {
      setText('');
      onDone?.();
    }
  };

  return (
    <form className="inline-form" onSubmit={submit}>
      <label>
        {label}
        {multiline ? (
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} required />
        ) : (
          <input value={text} onChange={(event) => setText(event.target.value)} required />
        )}
      </label>
      <ErrorMessage message={error} />
      <div className="actions">
        <button type="submit" disabled={pending || text.trim() === ''}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
