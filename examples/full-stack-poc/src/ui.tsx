import { useState } from 'react';

export interface TodoFormProps {
  onSubmit: (title: string) => void;
}

export function TodoForm({ onSubmit }: TodoFormProps): JSX.Element {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      data-testid="form"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) {
          setError('title required');
          return;
        }
        setError(null);
        onSubmit(trimmed);
        setValue('');
      }}
    >
      <input
        data-testid="input"
        aria-label="title"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">add</button>
      {error && <span role="status">{error}</span>}
    </form>
  );
}
