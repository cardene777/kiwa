// create-form.tsx — Client Component。 form submit で Server Action を呼ぶ。

'use client';

import { useActionState } from 'react';
import { createItem } from './actions';

interface FormState {
  ok: boolean;
  message: string;
  id?: number;
  name?: string;
}

const initialState: FormState = { ok: false, message: '' };

export function CreateItemForm() {
  const [state, formAction] = useActionState(createItem, initialState);
  return (
    <section>
      <h2>Create new item</h2>
      <form action={formAction}>
        <label>
          name: <input type="text" name="name" required minLength={2} />
        </label>
        <input type="hidden" name="seed" value="100" />
        <button type="submit">create</button>
      </form>
      {state.ok && typeof state.id === 'number' ? (
        <p data-testid="create-success">created id={state.id} name={state.name}</p>
      ) : null}
      {!state.ok && state.message.length > 0 ? (
        <p data-testid="create-error">error: {state.message}</p>
      ) : null}
    </section>
  );
}
