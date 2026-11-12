import { useEffect, useState } from 'react';
import { peopleApi } from '../api/endpoints';
import type { PersonSummary } from '../api/types';
import { roleLabels } from '../domain/roles';

const SEARCH_DELAY_MILLISECONDS = 300;
const MINIMUM_QUERY_LENGTH = 2;

interface PersonPickerProps {
  selected: PersonSummary | null;
  onSelect: (person: PersonSummary | null) => void;
  excludeId?: string;
}

export function PersonPicker({ selected, onSelect, excludeId }: PersonPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PersonSummary[]>([]);

  useEffect(() => {
    if (query.trim().length < MINIMUM_QUERY_LENGTH) {
      setResults([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      peopleApi
        .search(query.trim())
        .then((people) => setResults(people.filter((person) => person.id !== excludeId)))
        .catch(() => setResults([]));
    }, SEARCH_DELAY_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [query, excludeId]);

  if (selected) {
    return (
      <div className="selected-person">
        <span>
          {selected.fullName} <span className="muted">· {roleLabels[selected.role]}</span>
        </span>
        <button type="button" className="secondary" onClick={() => onSelect(null)}>
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="person-picker">
      <input
        type="search"
        placeholder="Escribe al menos dos letras del nombre"
        aria-label="Buscar persona"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {results.length > 0 && (
        <ul className="picker-results">
          {results.map((person) => (
            <li key={person.id}>
              <button type="button" className="link-button" onClick={() => onSelect(person)}>
                {person.fullName} <span className="muted">· {roleLabels[person.role]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
