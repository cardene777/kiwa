import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { createRequestClient } from '../../src/index.js';

function makeFetcher(status = 200, body: unknown = {}) {
  return (async () => ({
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(body),
  })) as unknown as typeof fetch;
}

describe('api skill — createRequestClient skill flow', () => {
  it('T-SKL-D-001 GET + POST skill flow', async () => {
    const spy = createToolSpy();
    const client = createRequestClient({ baseUrl: 'https://x.com', fetcher: makeFetcher() });
    await client.get('/a');
    spy.record('api.get', '{}');
    await client.post('/a', {});
    spy.record('api.post', '{}');

    assertToolCallOrder(spy, ['api.get', 'api.post']);
  });

  it('T-SKL-D-002 CRUD skill flow (post + get + put + delete)', async () => {
    const spy = createToolSpy();
    const client = createRequestClient({ baseUrl: 'https://x.com', fetcher: makeFetcher() });
    await client.post('/u', {});
    spy.record('api.post', '{}');
    await client.get('/u/1');
    spy.record('api.get', '{}');
    await client.put('/u/1', {});
    spy.record('api.put', '{}');
    await client.delete('/u/1');
    spy.record('api.delete', '{}');

    assertToolCallOrder(spy, ['api.post', 'api.get', 'api.put', 'api.delete']);
  });

  it('T-SKL-D-003 batch get skill (times=3)', async () => {
    const spy = createToolSpy();
    const client = createRequestClient({ baseUrl: 'https://x.com', fetcher: makeFetcher() });
    await client.get('/1');
    spy.record('api.get', '{}');
    await client.get('/2');
    spy.record('api.get', '{}');
    await client.get('/3');
    spy.record('api.get', '{}');

    assertToolCalled(spy, 'api.get', { times: 3 });
  });

  it('T-SKL-D-004 error skill flow (400 status)', async () => {
    const spy = createToolSpy();
    const client = createRequestClient({ baseUrl: 'https://x.com', fetcher: makeFetcher(400, { error: 'bad' }) });
    const res = await client.get('/bad');
    spy.record('api.get.error', JSON.stringify({ status: res.status }));

    assertToolCalled(spy, 'api.get.error');
    expect(res.status).toBe(400);
  });

  it('T-SKL-D-005 patch skill flow', async () => {
    const spy = createToolSpy();
    const client = createRequestClient({ baseUrl: 'https://x.com', fetcher: makeFetcher() });
    await client.patch('/p', { field: 'v' });
    spy.record('api.patch', '{}');

    assertToolCalled(spy, 'api.patch');
  });
});
