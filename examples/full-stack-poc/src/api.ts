import { validateTitle, type Todo } from './todo.js';
import type { ApiHandlerSource } from '@kiwa-test/api';

export interface TodoStore {
  list: () => Todo[];
  add: (title: string) => { ok: true; todo: Todo } | { ok: false; reason: string };
  toggle: (id: number) => Todo | null;
}

export function createTodoStore(): TodoStore {
  const todos: Todo[] = [];
  let nextId = 1;
  return {
    list: () => todos.slice(),
    add: (title) => {
      const v = validateTitle(title);
      if (!v.ok) return v;
      const todo: Todo = { id: nextId++, title: v.value, done: false };
      todos.push(todo);
      return { ok: true, todo };
    },
    toggle: (id) => {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return null;
      todo.done = !todo.done;
      return todo;
    },
  };
}

export function createTodoApi(store: TodoStore): ApiHandlerSource {
  return {
    kind: 'fetch',
    handler: async (req) => {
      const url = new URL(req.url);
      if (url.pathname === '/api/todos' && req.method === 'GET') {
        return Response.json(store.list());
      }
      if (url.pathname === '/api/todos' && req.method === 'POST') {
        let body: { title?: string };
        try {
          body = (await req.json()) as { title?: string };
        } catch {
          return Response.json({ error: 'invalid json' }, { status: 400 });
        }
        const result = store.add(body.title ?? '');
        if (!result.ok) return Response.json({ error: result.reason }, { status: 400 });
        return Response.json(result.todo, { status: 201 });
      }
      const toggleMatch = url.pathname.match(/^\/api\/todos\/(\d+)\/toggle$/);
      if (toggleMatch && req.method === 'POST') {
        const id = Number(toggleMatch[1]);
        const updated = store.toggle(id);
        if (!updated) return new Response('not found', { status: 404 });
        return Response.json(updated);
      }
      return new Response('not found', { status: 404 });
    },
  };
}
