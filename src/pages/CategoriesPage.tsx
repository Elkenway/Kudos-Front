import { type FormEvent, useState } from 'react';
import { categoryApi } from '../api/endpoints';
import type { CategoryView } from '../api/types';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { useAction } from '../hooks/useAction';
import { useAsync } from '../hooks/useAsync';

export function CategoriesPage() {
  const categories = useAsync(categoryApi.catalog);
  const [editing, setEditing] = useState<CategoryView | null>(null);
  const toggle = useAction();

  const toggleActive = async (category: CategoryView) => {
    const action = category.active ? categoryApi.deactivate : categoryApi.activate;
    if (await toggle.run(() => action(category.id))) {
      categories.reload();
    }
  };

  return (
    <section>
      <h1>Categorías de reconocimiento</h1>
      <CategoryForm
        key={editing?.id ?? 'new'}
        category={editing}
        onSaved={() => {
          setEditing(null);
          categories.reload();
        }}
        onCancel={() => setEditing(null)}
      />
      {categories.loading && <Loading />}
      <ErrorMessage message={categories.error ?? toggle.error} />
      {categories.data?.length === 0 && <EmptyState text="Aún no hay categorías." />}
      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.data?.map((category) => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>{category.description}</td>
              <td>{category.active ? 'Activa' : 'Inactiva'}</td>
              <td>
                <button type="button" className="link-button" onClick={() => setEditing(category)}>
                  Editar
                </button>
                <button type="button" className="link-button" disabled={toggle.pending} onClick={() => void toggleActive(category)}>
                  {category.active ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

interface CategoryFormProps {
  category: CategoryView | null;
  onSaved: () => void;
  onCancel: () => void;
}

function CategoryForm({ category, onSaved, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const { pending, error, run } = useAction();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const save = category
      ? () => categoryApi.modify(category.id, name, description)
      : () => categoryApi.create(name, description);
    if (await run(save)) {
      setName('');
      setDescription('');
      onSaved();
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h2>{category ? `Editar ${category.name}` : 'Nueva categoría'}</h2>
      <label>
        Nombre
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label>
        Descripción
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} required />
      </label>
      <ErrorMessage message={error} />
      <div className="actions">
        <button type="submit" disabled={pending}>
          {category ? 'Guardar cambios' : 'Crear categoría'}
        </button>
        {category && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
