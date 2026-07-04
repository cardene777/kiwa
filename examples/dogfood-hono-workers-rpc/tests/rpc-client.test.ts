import { describe, expect, it } from 'vitest';
import { buildDogfoodApp, resetRateLimit } from '../src/routes/app.js';
import { createDogfoodBindings } from '../src/workers/bindings.js';
import { createDogfoodRpc } from '../src/rpc/client.js';

describe('dogfood hc RPC client — type-safe request', () => {
  it('T-DHW-RC-001 client.health.$get returns 200 + ok body', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const client = createDogfoodRpc(app);
    const response = await client.health.$get({
      headers: { authorization: `Bearer ${bindings.env.AUTH_TOKEN}` },
      env: bindings.env,
    });
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ ok: true, route: 'health' });
  });

  it('T-DHW-RC-002 client.greet[":name"].$get walks param through path', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const client = createDogfoodRpc(app);
    const response = await client.greet[':name']!.$get({
      param: { name: 'zoe' },
      headers: { authorization: `Bearer ${bindings.env.AUTH_TOKEN}` },
      env: bindings.env,
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe('hello zoe');
  });

  it('T-DHW-RC-003 client["kv-counter"].$post increments counter', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const client = createDogfoodRpc(app);
    const first = await client['kv-counter'].$post({
      json: {},
      headers: {
        authorization: `Bearer ${bindings.env.AUTH_TOKEN}`,
        'content-type': 'application/json',
      },
      env: bindings.env,
    });
    expect(first.status).toBe(200);
    const firstJson = await first.json();
    expect(firstJson.previous).toBe(0);
    expect(firstJson.next).toBe(1);
    const second = await client['kv-counter'].$post({
      json: {},
      headers: {
        authorization: `Bearer ${bindings.env.AUTH_TOKEN}`,
        'content-type': 'application/json',
      },
      env: bindings.env,
    });
    const secondJson = await second.json();
    expect(secondJson.next).toBe(2);
  });

  it('T-DHW-RC-004 rpc response.text() serialises json body', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const client = createDogfoodRpc(app);
    const response = await client.health.$get({
      headers: { authorization: `Bearer ${bindings.env.AUTH_TOKEN}` },
      env: bindings.env,
    });
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ ok: true, route: 'health' });
  });

  it('T-DHW-RC-005 unauthenticated rpc call surfaces 401 status via response.ok=false', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const client = createDogfoodRpc(app);
    const response = await client.health.$get({ env: bindings.env });
    expect(response.status).toBe(401);
    expect(response.ok).toBe(false);
  });
});
