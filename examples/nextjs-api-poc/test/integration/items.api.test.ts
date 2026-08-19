import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { setupApiServer, type ApiTestEnv } from '@kiwa-lab/api';
import { createItemsHandler, type Item } from '../../src/route.js';

const envs: ApiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('items API (live mode)', () => {
  it('T-API-001 GET 正常系: 空配列を返す', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    const res = await env.request.get('/api/items');
    expect(res.status).toBe(200);
    expect(res.json<Item[]>()).toEqual([]);
  });

  it('T-API-002 POST 正常系: 201 + 新規 id 返却', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    const res = await env.request.post('/api/items', { name: 'first' });
    expect(res.status).toBe(201);
    expect(res.json<Item>()).toEqual({ id: 1, name: 'first' });
  });

  it('T-API-003 POST + GET の整合性', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    await env.request.post('/api/items', { name: 'a' });
    await env.request.post('/api/items', { name: 'b' });
    const list = await env.request.get('/api/items');
    expect(list.json<Item[]>()).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);
  });

  it('T-API-004 body 無し: 400', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    const res = await env.request.post('/api/items', {});
    expect(res.status).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('name required');
  });

  it('T-API-005 name 長過ぎ: 422', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    const res = await env.request.post('/api/items', { name: 'x'.repeat(101) });
    expect(res.status).toBe(422);
  });

  it('T-API-006 DELETE: 405', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    const res = await env.request.delete('/api/items');
    expect(res.status).toBe(405);
  });

  it('T-API-007 未対応 path: 404', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    const res = await env.request.get('/api/other');
    expect(res.status).toBe(404);
  });
});

describe('items API (mock mode)', () => {
  it('T-API-008 mock handler の固定応答が返る', async () => {
    const env = await setupApiServer({
      mode: 'mock',
      mockHandlers: [
        http.get('http://kiwa.mock/api/items', () =>
          HttpResponse.json([{ id: 999, name: 'mocked' }]),
        ),
      ],
    });
    envs.push(env);
    const res = await env.request.get('/api/items');
    expect(res.status).toBe(200);
    expect(res.json<Item[]>()).toEqual([{ id: 999, name: 'mocked' }]);
  });
});

describe('items API (hybrid mode)', () => {
  it('T-API-009 live 実装 + mock 経路共存、 上書きなしなら live 動作', async () => {
    const env = await setupApiServer({
      mode: 'hybrid',
      app: createItemsHandler(),
      mockHandlers: [],
    });
    envs.push(env);
    if (env.mode !== 'hybrid') throw new Error('expected hybrid');
    const created = await env.request.post('/api/items', { name: 'h' });
    expect(created.status).toBe(201);
    const list = await env.request.get('/api/items');
    expect(list.json<Item[]>()).toEqual([{ id: 1, name: 'h' }]);
    expect(typeof env.mocks.reset).toBe('function');
  });
});

// ---- ここから下は `/kiwa-design --layer api --module items` が未覆と判定した 5 件
// (T-API-010 / 011 / 012 / 013 / 014)。
// spec = tests/spec/integration/test-spec-items.api.ja.md
//
// 既存 9 件 (T-API-001 〜 009) は中身を読んで重複と判断したため書いていない。
// module 直下の `envs` と `afterEach` はそのまま使う
// (`existing-test-reuse.md` § 3 = 既存の後始末は変えない)。

describe('items API (未覆分の追記: 入力検証の分岐と境界)', () => {
  // 入力検証は 4 分岐あるが、 既存 test が踏むのは「name が無い」 の 1 つだけ。
  // 4 分岐とも 400 を返すため、 status だけを見る test では区別できない。
  // ここでは `error` の値まで見て分岐を固定する。
  it('T-API-010 JSON が壊れていれば 400 invalid json', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    const res = await env.request.post('/api/items', '{invalid');
    expect(res.status).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('invalid json');
  });

  it('T-API-011 name が文字列でなければ 400 name required', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    const res = await env.request.post('/api/items', { name: 123 });
    expect(res.status).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('name required');
  });

  it('T-API-012 name が空文字なら 400 name required', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    const res = await env.request.post('/api/items', { name: '' });
    expect(res.status).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('name required');
  });

  it('T-API-013 name 100 字ちょうどは 201', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    const name = 'x'.repeat(100);
    const res = await env.request.post('/api/items', { name });
    expect(res.status).toBe(201);
    expect(res.json<Item>()).toEqual({ id: 1, name });
  });

  it('T-API-014 未対応 path への POST は 405 ではなく 404', async () => {
    const env = await setupApiServer({ mode: 'live', app: createItemsHandler() });
    envs.push(env);
    const res = await env.request.post('/api/other', { name: 'x' });
    expect(res.status).toBe(404);
  });
});
