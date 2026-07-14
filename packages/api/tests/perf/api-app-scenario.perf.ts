/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createRequestClient } from '../../src/index.js';

const MODULE = 'api-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

function makeFetcher() {
  return (async () => ({
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    text: async () => JSON.stringify({ ok: true, data: [1, 2, 3] }),
  })) as unknown as typeof fetch;
}

describe('api app scenario perf (real workload)', () => {
  it('3-layer perf: rest crud / batch call / retry with auth', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 30,
      serialWarmup: 5,
      concurrency: 4,
      iterationsPerWorker: 8,
      memoryIterations: 30,
      ops: [
        {
          name: 'rest_crud_flow (POST create + GET fetch + PUT update + DELETE)',
          fn: async () => {
            const client = createRequestClient({ baseUrl: 'https://x.com', fetcher: makeFetcher() });
            await client.post('/users', { name: 'kiwa' });
            await client.get('/users/1');
            await client.put('/users/1', { name: 'updated' });
            await client.delete('/users/1');
          },
          serialP95CapMs: 30,
        },
        {
          name: 'batch_api_call (10 GET rapid)',
          fn: async () => {
            const client = createRequestClient({ baseUrl: 'https://x.com', fetcher: makeFetcher() });
            for (let i = 0; i < 10; i++) await client.get(`/items/${i}`);
          },
          serialP95CapMs: 50,
        },
        {
          name: 'auth_header_workflow (10 request with x-api-key)',
          fn: async () => {
            const client = createRequestClient({
              baseUrl: 'https://x.com',
              defaultHeaders: { 'x-api-key': 'secret' },
              fetcher: makeFetcher(),
            });
            for (let i = 0; i < 10; i++) await client.get(`/protected/${i}`);
          },
          serialP95CapMs: 50,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
