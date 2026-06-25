// Pure domain logic (unit-tested).
export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

export function normalizeTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function validateTitle(raw: string): { ok: true; value: string } | { ok: false; reason: string } {
  const normalized = normalizeTitle(raw);
  if (normalized.length === 0) return { ok: false, reason: 'title required' };
  if (normalized.length > 100) return { ok: false, reason: 'title too long' };
  return { ok: true, value: normalized };
}

export function summarize(todos: Todo[]): { total: number; done: number; pending: number; doneRatio: number } {
  const total = todos.length;
  const done = todos.filter((t) => t.done).length;
  const pending = total - done;
  return { total, done, pending, doneRatio: total === 0 ? 0 : done / total };
}
