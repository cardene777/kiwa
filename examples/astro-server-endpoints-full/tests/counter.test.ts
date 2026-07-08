// kiwa unit test for src/pages/api/_kiwa/counter-endpoint.ts
// — multi-method (GET / POST) + locals.requestId injection を検証。

import { beforeEach, describe, expect, it } from 'vitest';
import { invokeEndpoint } from '@kiwa/astro';
import {
  counterGetEndpoint,
  counterPostEndpoint,
  resetCounterState,
} from '../src/pages/api/_kiwa/counter-endpoint.js';

async function readJson(response: Response): Promise<unknown> {
  return await response.clone().json();
}

describe('counterEndpoint via @kiwa/astro invokeEndpoint', () => {
  beforeEach(() => {
    resetCounterState(0);
  });

  it('T-AF-201: GET — initial count=0、 locals 不在で x-request-id=unknown', async () => {
    const { response } = await invokeEndpoint({
      endpoint: counterGetEndpoint,
      url: 'http://localhost/api/counter',
    });
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ count: 0 });
    expect(response.headers.get('x-request-id')).toBe('unknown');
  });

  it('T-AF-202: GET — locals.requestId inject で response header に echo', async () => {
    const { response } = await invokeEndpoint({
      endpoint: counterGetEndpoint,
      url: 'http://localhost/api/counter',
      locals: { requestId: 'abc-123' },
    });
    expect(response.headers.get('x-request-id')).toBe('abc-123');
  });

  it('T-AF-203: POST — delta=5 で count=5 を返却', async () => {
    const { response } = await invokeEndpoint({
      endpoint: counterPostEndpoint,
      url: 'http://localhost/api/counter',
      method: 'POST',
      formData: { delta: '5' },
      locals: { requestId: 'req-1' },
    });
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ count: 5 });
    expect(response.headers.get('x-request-id')).toBe('req-1');
  });

  it('T-AF-204: POST — 不正 delta=abc → 400 + field error', async () => {
    const { response } = await invokeEndpoint({
      endpoint: counterPostEndpoint,
      url: 'http://localhost/api/counter',
      method: 'POST',
      formData: { delta: 'abc' },
    });
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ field: 'delta', message: 'delta must be an integer' });
  });

  it('T-AF-205: 連続 POST で state が累積する', async () => {
    await invokeEndpoint({
      endpoint: counterPostEndpoint,
      url: 'http://localhost/api/counter',
      method: 'POST',
      formData: { delta: '3' },
    });
    const { response } = await invokeEndpoint({
      endpoint: counterPostEndpoint,
      url: 'http://localhost/api/counter',
      method: 'POST',
      formData: { delta: '4' },
    });
    expect(await readJson(response)).toEqual({ count: 7 });
  });
});
