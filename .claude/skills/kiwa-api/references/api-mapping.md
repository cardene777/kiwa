# 11 + 2 観点 → msw / supertest / Playwright request マッピング

`docs/SKILL-DESIGN.md` § Step 3 の 11 観点 + (PR #301 で追加) 12 / 13 観点を API integration test の 3 backend (msw / supertest / Playwright request) に変換する code snippet 集。

## backend 選択指針

| backend | 適用場面 |
|---|---|
| **msw** | Next.js App Router (`app/api/*/route.ts`) で fetch 経由 self-call、 frontend ↔ API 両方を覆う |
| **supertest** | Pure Node API (Express / Fastify) で app instance に直接 request 投げ込み、 HTTP 層を最小オーバーヘッドで test |
| **Playwright request** | E2E 寄りで実 dev server を起動し HTTP layer 全部を通す、 frontend なし API のみ test |

default は msw (Next.js App Router 想定)、 `--backend supertest` / `--backend playwright` で切替。

## 観点 1: 正常系

### msw

```ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/mint/:tokenId', ({ params }) => {
    return HttpResponse.json({ tokenId: params.tokenId, owner: '0xabc' });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('observation 1 — happy path', () => {
  it('TC-001 — GET /api/mint/1 returns the minted owner', async () => {
    const r = await fetch('/api/mint/1');
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ tokenId: '1', owner: '0xabc' });
  });
});
```

### supertest

```ts
import request from 'supertest';
import { app } from '@/app';

it('TC-001 — GET /api/mint/1 returns the minted owner', async () => {
  await request(app)
    .get('/api/mint/1')
    .expect(200)
    .expect(({ body }) => expect(body.owner).toBe('0xabc'));
});
```

### Playwright request

```ts
import { test, expect } from '@playwright/test';

test('TC-001 — GET /api/mint/1 returns the minted owner', async ({ request }) => {
  const r = await request.get('http://localhost:3033/api/mint/1');
  expect(r.status()).toBe(200);
  expect(await r.json()).toEqual({ tokenId: '1', owner: '0xabc' });
});
```

## 観点 2: 異常系

```ts
// msw — 503 を返す mock で fallback 経路を test
server.use(
  http.get('/api/balance', () => HttpResponse.json({ message: 'rpc down' }, { status: 503 })),
);

it('TC-NN — surfaces 503 to the UI as retry hint', async () => {
  const r = await fetch('/api/balance');
  expect(r.status).toBe(503);
});
```

## 観点 3: 境界値

```ts
it.each([
  { tokenId: '0', expected: 422 },
  { tokenId: '100', expected: 200 },
  { tokenId: '101', expected: 422 },
])('TC-NN — boundary tokenId=$tokenId → $expected', async ({ tokenId, expected }) => {
  const r = await fetch(`/api/mint/${tokenId}`);
  expect(r.status).toBe(expected);
});
```

## 観点 4: 状態遷移

```ts
// msw handler が counter を持って state を進める
let callCount = 0;
server.use(
  http.post('/api/proposal', () => {
    callCount += 1;
    const status = callCount === 1 ? 'proposed' : callCount === 2 ? 'voted' : 'executed';
    return HttpResponse.json({ status });
  }),
);

it('TC-NN — proposed → voted → executed sequence', async () => {
  const r1 = await fetch('/api/proposal', { method: 'POST' });
  expect((await r1.json()).status).toBe('proposed');
  const r2 = await fetch('/api/proposal', { method: 'POST' });
  expect((await r2.json()).status).toBe('voted');
  const r3 = await fetch('/api/proposal', { method: 'POST' });
  expect((await r3.json()).status).toBe('executed');
});
```

## 観点 5: 権限

```ts
// msw で Authorization header を見て role 別 response
server.use(
  http.get('/api/admin/users', ({ request }) => {
    const token = request.headers.get('Authorization');
    if (token !== 'Bearer admin') {
      return HttpResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return HttpResponse.json({ users: [] });
  }),
);

it.each([
  { token: 'Bearer admin', expected: 200 },
  { token: 'Bearer user', expected: 403 },
])('TC-NN — role with $token → $expected', async ({ token, expected }) => {
  const r = await fetch('/api/admin/users', { headers: { Authorization: token } });
  expect(r.status).toBe(expected);
});
```

## 観点 6: 入力バリデーション

```ts
it.each([
  { body: { name: "'; DROP TABLE--" }, label: 'SQL injection' },
  { body: { name: '<script>alert(1)</script>' }, label: 'XSS payload' },
])('TC-NN — POST /api/profile rejects $label with 422', async ({ body }) => {
  const r = await fetch('/api/profile', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  expect(r.status).toBe(422);
});
```

## 観点 7: 冪等性

```ts
it('TC-NN — webhook with same event_id processes once', async () => {
  const event = { id: 'evt-1', payload: {} };
  const r1 = await fetch('/api/webhook', { method: 'POST', body: JSON.stringify(event) });
  const r2 = await fetch('/api/webhook', { method: 'POST', body: JSON.stringify(event) });
  expect((await r1.json()).applied).toBe(true);
  expect((await r2.json()).applied).toBe(false);
});
```

## 観点 8: 並行処理

```ts
it('TC-NN — 2 parallel mints of the same tokenId — 1 success + 1 conflict', async () => {
  const results = await Promise.all([
    fetch('/api/mint/1', { method: 'POST' }).then((r) => r.status),
    fetch('/api/mint/1', { method: 'POST' }).then((r) => r.status),
  ]);
  expect(results.filter((s) => s === 200).length).toBe(1);
  expect(results.filter((s) => s === 409).length).toBe(1);
});
```

## 観点 9: 性能

```ts
it('TC-NN — 100 sequential GET /api/balance — p95 under 50ms', async () => {
  const samples: number[] = [];
  for (let i = 0; i < 100; i += 1) {
    const start = performance.now();
    await fetch('/api/balance');
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  expect(samples[Math.floor(samples.length * 0.95)]).toBeLessThan(50);
});
```

## 観点 10: セキュリティ

```ts
it('TC-NN — rejects replay of used nonce', async () => {
  const tx = { nonce: 1, sig: '0x...' };
  const r1 = await fetch('/api/relay-tx', { method: 'POST', body: JSON.stringify(tx) });
  expect(r1.status).toBe(200);
  const r2 = await fetch('/api/relay-tx', { method: 'POST', body: JSON.stringify(tx) });
  expect(r2.status).toBe(409);
});
```

## 観点 11: 回帰

```ts
// Issue #1234 の HTTP-level reproducer
it('TC-NN — Issue #1234 — empty body POST does not 500', async () => {
  const r = await fetch('/api/mint/1', { method: 'POST' });
  expect(r.status).not.toBe(500);
  expect(r.status).toBe(422);
});
```

## 観点 12: UI feature 網羅 (非適用)

integration layer は API surface 専用、 UI element は対象外。 spec 観点を選ぶ際に「適用しない」 と明示する。

## 観点 13: wallet 接続 flow

wallet 接続 API endpoint がある場合 (例 nonce 配布 endpoint) は mock 経由で wallet state を返す。

```ts
server.use(
  http.get('/api/wallet/nonce', () => HttpResponse.json({ nonce: 'abc' })),
);

it('TC-NN — GET /api/wallet/nonce returns a fresh nonce', async () => {
  const r = await fetch('/api/wallet/nonce');
  expect(r.status).toBe(200);
  expect((await r.json()).nonce).toBeDefined();
});
```

## 関連

- SSOT: `docs/SKILL-DESIGN.md` § Step 3 (11 観点)
- 観点 × Layer 2 ランナー早見: `kiwa-design/references/viewpoints-catalog.md`
- msw 公式: https://mswjs.io/docs/
- supertest 公式: https://github.com/ladjs/supertest
- Playwright request 公式: https://playwright.dev/docs/api-testing
