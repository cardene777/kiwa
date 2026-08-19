import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { setupApiServer, type ApiTestEnv, type MockHandler } from '@kiwa-lab/api';

import {
  StockResponseError,
  StockUnavailableError,
  fetchStock,
} from '../../src/inventory.js';

// spec = tests/spec/integration/test-spec-inventory.md

const STOCK_URL = 'https://stock.example/v1/items/:sku';

const envs: ApiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

/**
 * msw を起動して外向きの `fetch` を捕捉する。
 *
 * TC ごとに handler を作り直す = 使い回すと前の TC の応答が残り、 失敗の分類が
 * 実行順に依存する。
 */
async function withStock(handlers: MockHandler[]): Promise<void> {
  const env = await setupApiServer({ mode: 'mock', mockHandlers: handlers });
  envs.push(env);
}

describe('inventory integration (mode: mock)', () => {
  it('T-INT-001 正常応答を型に写す', async () => {
    await withStock([
      http.get(STOCK_URL, () => HttpResponse.json({ sku: 'a-1', available: 3 })),
    ]);
    await expect(fetchStock('a-1')).resolves.toEqual({ sku: 'a-1', available: 3 });
  });

  it('T-INT-002 在庫 0 と未知を区別する', async () => {
    // `0` を `null` に潰すと、 呼出側は「在庫切れ」 と「SKU が無い」 を区別できない。
    await withStock([
      http.get(STOCK_URL, () => HttpResponse.json({ sku: 'a-1', available: 0 })),
    ]);
    await expect(fetchStock('a-1')).resolves.toEqual({ sku: 'a-1', available: 0 });
  });

  it('T-INT-003 未知の SKU は null', async () => {
    await withStock([http.get(STOCK_URL, () => new HttpResponse(null, { status: 404 }))]);
    await expect(fetchStock('nope')).resolves.toBeNull();
  });

  it('T-INT-004 5xx は再試行可能な失敗', async () => {
    await withStock([http.get(STOCK_URL, () => new HttpResponse(null, { status: 503 }))]);
    await expect(fetchStock('a-1')).rejects.toBeInstanceOf(StockUnavailableError);
    // status を持たないと呼出側が backoff の判断材料を失う。
    await withStock([http.get(STOCK_URL, () => new HttpResponse(null, { status: 503 }))]);
    await expect(fetchStock('a-1')).rejects.toMatchObject({ status: 503 });
  });

  it('T-INT-005 4xx は再試行しても直らない', async () => {
    await withStock([http.get(STOCK_URL, () => new HttpResponse(null, { status: 400 }))]);
    await expect(fetchStock('a-1')).rejects.toBeInstanceOf(StockResponseError);
  });

  it('T-INT-006 本体が JSON でない', async () => {
    await withStock([http.get(STOCK_URL, () => new HttpResponse('not json', { status: 200 }))]);
    await expect(fetchStock('a-1')).rejects.toBeInstanceOf(StockResponseError);
  });

  it('T-INT-007 形が違う応答', async () => {
    await withStock([http.get(STOCK_URL, () => HttpResponse.json({ sku: 'a-1' }))]);
    await expect(fetchStock('a-1')).rejects.toBeInstanceOf(StockResponseError);
  });

  it('T-INT-008 負の在庫は通さない', async () => {
    // 上流の欠陥をそのまま通すと、 呼出側の計算が静かに狂う。
    await withStock([
      http.get(STOCK_URL, () => HttpResponse.json({ sku: 'a-1', available: -1 })),
    ]);
    await expect(fetchStock('a-1')).rejects.toBeInstanceOf(StockResponseError);
  });

  it('T-INT-009 SKU を URL に安全に載せる', async () => {
    let seen: string | undefined;
    await withStock([
      http.get(STOCK_URL, ({ request }) => {
        seen = new URL(request.url).pathname;
        return HttpResponse.json({ sku: 'a/1', available: 1 });
      }),
    ]);
    await fetchStock('a/1');
    // encode を外すと `a/1` が別 path として飛び、 handler に届かない。
    expect(seen).toBe('/v1/items/a%2F1');
  });
});
