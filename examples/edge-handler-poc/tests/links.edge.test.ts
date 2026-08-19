import { describe, expect, it } from 'vitest';
import {
  createKvNamespace,
  invokeEdgeHandler,
  type EdgeEnvBindings,
  type EdgeFetchHandler,
  type KVNamespace,
} from '@kiwa-lab/edge';

import worker from '../src/worker.js';

// spec = tests/spec/integration/test-spec-links.edge.md

const handler = worker.fetch as unknown as EdgeFetchHandler;

/**
 * TC ごとに作り直す。 使い回すと前の TC の書込が残り、 T-EDGE-005 の計数が
 * 実行順に依存する。
 *
 * KV の実体も一緒に返す = 書込の結果を見る TC (005 / 008) が binding を辿らずに済む。
 */
function env(
  seed: Record<string, string> = {},
  apiKey?: string,
): { bindings: EdgeEnvBindings; links: KVNamespace } {
  const links = createKvNamespace(seed);
  const bindings: EdgeEnvBindings =
    apiKey === undefined ? { LINKS: links } : { LINKS: links, API_KEY: apiKey };
  return { bindings, links };
}

describe('links edge handler', () => {
  it('T-EDGE-001 健全性確認は binding 無しで通る', async () => {
    const { response } = await invokeEdgeHandler({
      handler,
      url: 'https://links.test/health',
      env: env().bindings,
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('T-EDGE-002 未登録の slug は 404', async () => {
    const { response } = await invokeEdgeHandler({
      handler,
      url: 'https://links.test/missing',
      env: env().bindings,
    });
    expect(response.status).toBe(404);
  });

  it('T-EDGE-003 登録済 slug は redirect する', async () => {
    const { redirect } = await invokeEdgeHandler({
      handler,
      url: 'https://links.test/go',
      env: env({ 'link:go': 'https://example.com' }).bindings,
    });
    expect(redirect?.status).toBe(302);
    expect(redirect?.url).toBe('https://example.com');
  });

  it('T-EDGE-004 計数は応答を待たせない', async () => {
    const { ctx } = await invokeEdgeHandler({
      handler,
      url: 'https://links.test/go',
      env: env({ 'link:go': 'https://example.com' }).bindings,
    });
    // 応答を返す前に await していないことを、 載った promise の数で見る。
    expect(ctx.waitedPromises).toHaveLength(1);
  });

  it('T-EDGE-005 計数は待った後に反映される', async () => {
    const { bindings, links } = env({ 'link:go': 'https://example.com' });
    const { ctx } = await invokeEdgeHandler({
      handler,
      url: 'https://links.test/go',
      env: bindings,
    });
    // **await しないと副作用は反映されない**。 T-EDGE-004 は「載せたか」、
    // ここは「実行されるか」 を見る = 片方だけでは載せただけの形を捕まえられない。
    await Promise.all(ctx.waitedPromises);
    expect(await links.get('hits:go')).toBe('1');
  });

  it('T-EDGE-006 鍵が無ければ登録を拒む', async () => {
    const { response } = await invokeEdgeHandler({
      handler,
      url: 'https://links.test/links',
      method: 'POST',
      jsonBody: { slug: 'new', target: 'https://example.com' },
      env: env().bindings,
    });
    expect(response.status).toBe(403);
  });

  it('T-EDGE-007 鍵が違えば登録を拒む', async () => {
    const { response } = await invokeEdgeHandler({
      handler,
      url: 'https://links.test/links',
      method: 'POST',
      headers: { 'x-api-key': 'wrong' },
      jsonBody: { slug: 'new', target: 'https://example.com' },
      env: env({}, 'secret').bindings,
    });
    expect(response.status).toBe(403);
  });

  it('T-EDGE-008 鍵が一致すれば登録する', async () => {
    const { bindings, links } = env({}, 'secret');
    const { response } = await invokeEdgeHandler({
      handler,
      url: 'https://links.test/links',
      method: 'POST',
      headers: { 'x-api-key': 'secret' },
      jsonBody: { slug: 'new', target: 'https://example.com' },
      env: bindings,
    });
    expect(response.status).toBe(201);
    expect(await links.get('link:new')).toBe('https://example.com');
  });

  it('T-EDGE-009 必須項目が欠ければ 400', async () => {
    const { response } = await invokeEdgeHandler({
      handler,
      url: 'https://links.test/links',
      method: 'POST',
      headers: { 'x-api-key': 'secret' },
      jsonBody: { slug: 'new' },
      env: env({}, 'secret').bindings,
    });
    expect(response.status).toBe(400);
  });

  it('T-EDGE-010 本体が JSON でなければ通過させる', async () => {
    const { response, ctx } = await invokeEdgeHandler({
      handler,
      url: 'https://links.test/links',
      method: 'POST',
      headers: { 'x-api-key': 'secret' },
      formData: { slug: 'new', target: 'https://example.com' },
      env: env({}, 'secret').bindings,
    });
    expect(response.status).toBe(400);
    // handler 自身の欠陥ではないので、 例外を握らず runtime へ渡す意思表示をする。
    expect(ctx.passThroughCalled).toBe(true);
  });
});
