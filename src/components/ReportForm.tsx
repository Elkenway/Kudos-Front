import { type FormEvent, useState } from 'react';
import { contentApi } from '../api/endpoints';
import type { ContentType, ReportReason } from '../api/types';
import { reportReasonLabels } from '../domain/labels';
import { useAction } from '../hooks/useAction';
import { ErrorMessage } from './Feedback';

interface ReportFormProps {
  contentType: ContentType;
  contentId: string;
  onReported: () => void;
  onCancel: () => void;
}

const REASONS = Object.keys(reportReasonLabels) as ReportReason[];

export function ReportForm({ contentType, contentId, onReported, onCancel }: ReportFormProps) {
  const [reason, setReason] = useState<ReportReason>('OFFENSIVE_LANGUAGE');
  const [detail, setDetail] = useState('');
  const { pending, error, run } = useAction();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await run(() => contentApi.report(contentType, contentId, reason, detail))) {
      onReported();
    }
  };

  return (
    <form className="inline-form" onSubmit={submit}>
      <label>
        Motivo
        <select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
          {REASONS.map((option) => (
            <option key={option} value={option}>
              {reportReasonLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Detalle {reason === 'OTHER' ? '(obligatorio)' : '(opcional)'}
        <textarea value={detail} onChange={(event) => setDetail(event.target.value)} rows={2} />
      </label>
      <ErrorMessage message={error} />
      <div className="actions">
        <button type="submit" disabled={pending}>
          Enviar reporte
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
