import { batch, mockSignal, mockEffect, type EffectHandle, type SignalGetter, type SignalSetter } from '@kiwa-lab/solidjs';

/**
 * Todos store — a Signal<Todo[]> plus a derived effect that counts
 * completed items after each write. The store is the fine-grained update
 * fixture — every mutation goes through a copy-on-write helper so the
 * Signal setter sees a new reference (matches Solid's Object.is dedup).
 *
 * `batch()` is exposed on the store surface so callers can group multiple
 * mutations (e.g., mark-all-complete) into a single effect run. Tests
 * assert that N mutations inside a batch produce exactly 1 additional
 * trace entry.
 */
export interface TodoItem {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
}

export interface TodosStore {
  readonly todos: SignalGetter<ReadonlyArray<TodoItem>>;
  readonly setTodos: SignalSetter<ReadonlyArray<TodoItem>>;
  readonly effect: EffectHandle<number>;
  readonly completedCount: () => number;
  readonly add: (title: string) => void;
  readonly toggle: (id: string) => void;
  readonly remove: (id: string) => void;
  readonly markAll: (completed: boolean) => void;
  readonly dispose: () => void;
}

export function createTodosStore(initial: ReadonlyArray<TodoItem> = []): TodosStore {
  const [todos, setTodos] = mockSignal<ReadonlyArray<TodoItem>>(initial);
  let latestCompleted = countCompleted(initial);
  // Per-store id counter so tests running in the same process do not observe
  // cross-store id drift (each store starts at t0 on construction).
  let localIdCounter = 0;
  const effect = mockEffect<number>(() => {
    const list = todos();
    latestCompleted = countCompleted(list);
    return latestCompleted;
  });
  return {
    todos,
    setTodos,
    effect,
    completedCount: () => latestCompleted,
    add: (title) => {
      const nextId = `t${localIdCounter++}`;
      setTodos((prev) => [...prev, { id: nextId, title, completed: false }]);
    },
    toggle: (id) => {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      );
    },
    remove: (id) => {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    },
    markAll: (completed) => {
      batch(() => {
        setTodos((prev) => prev.map((t) => ({ ...t, completed })));
      });
    },
    dispose: () => effect.dispose(),
  };
}

function countCompleted(list: ReadonlyArray<TodoItem>): number {
  let n = 0;
  for (const t of list) if (t.completed) n += 1;
  return n;
}
