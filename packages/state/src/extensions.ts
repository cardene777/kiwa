/**
 * v2.1 extensions — middleware chain, undo/redo, persistence,
 * plus retry/batch/observability/timeout generics.
 * Zustand v5 / Redux Toolkit v2 追随。
 */

export type StateMiddleware<S> = (state: S, action: { type: string; payload?: unknown }, next: () => S) => S;

/** middleware chain — dispatch を wrap して logger / crash reporter / persistence を注入 */
export function composeMiddleware<S>(...middlewares: StateMiddleware<S>[]): StateMiddleware<S> {
  return (state, action, finalNext) => {
    let idx = -1;
    const dispatch = (i: number, s: S): S => {
      if (i <= idx) throw new Error('next() called multiple times');
      idx = i;
      if (i === middlewares.length) return finalNext();
      return middlewares[i]!(s, action, () => dispatch(i + 1, s));
    };
    return dispatch(0, state);
  };
}

export interface UndoRedoStack<S> {
  push: (state: S) => void;
  undo: () => S | undefined;
  redo: () => S | undefined;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
  size: () => { past: number; future: number };
}

/** undo/redo stack — history persistence + timeline navigation */
export function createUndoRedoStack<S>(initial?: S, maxSize = 100): UndoRedoStack<S> {
  const past: S[] = [];
  const future: S[] = [];
  let current: S | undefined = initial;
  return {
    push(state) {
      if (current !== undefined) past.push(current);
      if (past.length > maxSize) past.shift();
      current = state;
      future.length = 0;
    },
    undo() {
      const prev = past.pop();
      if (prev === undefined) return undefined;
      if (current !== undefined) future.push(current);
      current = prev;
      return current;
    },
    redo() {
      const next = future.pop();
      if (next === undefined) return undefined;
      if (current !== undefined) past.push(current);
      current = next;
      return current;
    },
    canUndo() { return past.length > 0; },
    canRedo() { return future.length > 0; },
    clear() { past.length = 0; future.length = 0; },
    size() { return { past: past.length, future: future.length }; },
  };
}

export interface PersistenceAdapter {
  save: (key: string, value: string) => Promise<void>;
  load: (key: string) => Promise<string | null>;
  remove: (key: string) => Promise<void>;
}

/** in-memory persistence adapter (localStorage / AsyncStorage 相当) */
export function createMemoryPersistence(): PersistenceAdapter {
  const store = new Map<string, string>();
  return {
    async save(key, value) { store.set(key, value); },
    async load(key) { return store.get(key) ?? null; },
    async remove(key) { store.delete(key); },
  };
}

export interface PersistedStore<S> {
  save: (state: S) => Promise<void>;
  restore: () => Promise<S | undefined>;
  clear: () => Promise<void>;
}

/** persist store to adapter with serialization */
export function createPersistedStore<S>(key: string, adapter: PersistenceAdapter): PersistedStore<S> {
  return {
    async save(state) { await adapter.save(key, JSON.stringify(state)); },
    async restore() {
      const raw = await adapter.load(key);
      if (raw === null) return undefined;
      try { return JSON.parse(raw) as S; }
      catch { return undefined; }
    },
    async clear() { await adapter.remove(key); },
  };
}

export interface RetryOptions { maxAttempts?: number; initialDelayMs?: number; backoffFactor?: number; }
export interface RetryResult<T> { ok: boolean; attempts: number; value?: T; error?: unknown; }

export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<RetryResult<T>> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 10;
  const factor = options.backoffFactor ?? 2;
  let attempts = 0;
  let lastError: unknown;
  while (attempts < maxAttempts) {
    attempts += 1;
    try { return { ok: true, attempts, value: await fn() }; }
    catch (e) {
      lastError = e;
      if (attempts >= maxAttempts) break;
      await new Promise((r) => { const t = setTimeout(r, initialDelay * Math.pow(factor, attempts - 1)); (t as unknown as { unref?: () => void }).unref?.(); });
    }
  }
  return { ok: false, attempts, error: lastError };
}

export interface ObservabilityHook {
  emit: (event: { kind: string; data: Record<string, unknown> }) => void;
  events: () => Array<{ kind: string; data: Record<string, unknown> }>;
  clear: () => void;
}

export function createObservabilityHook(): ObservabilityHook {
  const events: Array<{ kind: string; data: Record<string, unknown> }> = [];
  return { emit(e) { events.push(e); }, events() { return [...events]; }, clear() { events.length = 0; } };
}
