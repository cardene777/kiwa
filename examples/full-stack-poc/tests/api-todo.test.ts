// Layer: integration (api adapter, vitest --environment node)
import { afterEach, describe, expect, it } from 'vitest';
import { setupApiServer, type ApiTestEnv } from '@kiwa/api';
import { createTodoApi, createTodoStore } from '../src/api.js';
import type { Todo } from '../src/todo.js';

const envs: ApiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('todo API (live)', () => {
  it('GET /api/todos returns []', async () => {
    const env = await setupApiServer({ mode: 'live', app: createTodoApi(createTodoStore()) });
    envs.push(env);
    const res = await env.request.get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.json<Todo[]>()).toEqual([]);
  });

  it('POST /api/todos creates a todo (201)', async () => {
    const env = await setupApiServer({ mode: 'live', app: createTodoApi(createTodoStore()) });
    envs.push(env);
    const res = await env.request.post('/api/todos', { title: 'walk the dog' });
    expect(res.status).toBe(201);
    expect(res.json<Todo>()).toEqual({ id: 1, title: 'walk the dog', done: false });
  });

  it('POST + GET round trip reflects writes', async () => {
    const env = await setupApiServer({ mode: 'live', app: createTodoApi(createTodoStore()) });
    envs.push(env);
    await env.request.post('/api/todos', { title: 'a' });
    await env.request.post('/api/todos', { title: 'b' });
    const list = await env.request.get('/api/todos');
    expect(list.json<Todo[]>().map((t) => t.title)).toEqual(['a', 'b']);
  });

  it('POST /api/todos with empty title returns 400', async () => {
    const env = await setupApiServer({ mode: 'live', app: createTodoApi(createTodoStore()) });
    envs.push(env);
    const res = await env.request.post('/api/todos', { title: '' });
    expect(res.status).toBe(400);
  });

  it('POST /api/todos/:id/toggle flips done', async () => {
    const env = await setupApiServer({ mode: 'live', app: createTodoApi(createTodoStore()) });
    envs.push(env);
    const created = await env.request.post('/api/todos', { title: 'x' });
    const id = created.json<Todo>().id;
    const toggled = await env.request.post(`/api/todos/${id}/toggle`);
    expect(toggled.json<Todo>().done).toBe(true);
  });
});
