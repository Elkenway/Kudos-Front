import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryApi, kudoApi } from '../api/endpoints';
import type { PersonSummary } from '../api/types';
import { useSession } from '../auth/useAuth';
import { ErrorMessage } from '../components/Feedback';
import { PersonPicker } from '../components/PersonPicker';
import { useAction } from '../hooks/useAction';
import { useAsync } from '../hooks/useAsync';

export function NewKudoPage() {
  const session = useSession();
  const navigate = useNavigate();
  const categories = useAsync(categoryApi.catalog);
  const [recipient, setRecipient] = useState<PersonSummary | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [body, setBody] = useState('');
  const { pending, error, run } = useAction();

  const activeCategories = categories.data?.filter((category) => category.active) ?? [];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!recipient) {
      return;
    }
    let createdId = '';
    const published = await run(async () => {
      createdId = (await kudoApi.publish(recipient.id, categoryId, body)).id;
    });
    if (published) {
      navigate(`/kudos/${createdId}`);
    }
  };

  return (
    <section className="narrow">
      <h1>Reconocer a alguien</h1>
      <form className="card form" onSubmit={submit}>
        <span className="field-label">Persona a reconocer</span>
        <PersonPicker selected={recipient} onSelect={setRecipient} excludeId={session.account.id} />
        <label>
          Categoría
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
            <option value="">Selecciona una categoría</option>
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mensaje
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={6} required />
        </label>
        <ErrorMessage message={error ?? categories.error} />
        <button type="submit" disabled={pending || !recipient}>
          Publicar Kudo
        </button>
      </form>
    </section>
  );
}
