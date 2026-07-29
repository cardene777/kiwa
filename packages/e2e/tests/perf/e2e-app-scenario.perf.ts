/// <reference types="vitest/globals" />
import { startServer } from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'e2e-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('e2e app scenario perf (real workload)', () => {
  it('3-layer perf: rest workflow (GET+POST+DELETE) / concurrent read batch / error handling', async () => {
    const store = new Map<string, unknown>([['1', { name: 'kiwa' }]]);
    const server = await startServer({
      kind: 'fetch',
      handler: async (req) => {
        const url = new URL(req.url);
        const match = url.pathname.match(/^\/items(?:\/(.+))?$/);
        const id = match?.[1];
        if (url.pathname === '/fail') {
          return new Response('{"error":"boom"}', {
            status: 500,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (req.method === 'GET' && id) {
          const body = store.get(id);
          return new Response(JSON.stringify(body ?? {}), {
            status: body ? 200 : 404,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (req.method === 'POST') {
          const body = await req.json();
          const newId = `${store.size + 1}`;
          store.set(newId, body);
          return new Response(JSON.stringify({ id: newId }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (req.method === 'DELETE' && id) {
          store.delete(id);
          return new Response('', { status: 204 });
        }
        return new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } });
      },
    });

    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 30,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 30,
      ops: [
        {
          name: 'rest_workflow (POST create + GET read + DELETE cycle x3)',
          fn: async () => {
            for (let i = 0; i < 3; i++) {
              const created = await fetch(`${server.baseUrl}/items`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ n: i }),
              });
              const { id } = (await created.json()) as { id: string };
              const read = await fetch(`${server.baseUrl}/items/${id}`);
              await read.text();
              await fetch(`${server.baseUrl}/items/${id}`, { method: 'DELETE' });
            }
          },
          serialP95CapMs: 300,
        },
        {
          name: 'concurrent_read_batch (5 GET via Promise.all)',
          fn: async () => {
            const reads = Array.from({ length: 5 }, () => fetch(`${server.baseUrl}/items/1`));
            const responses = await Promise.all(reads);
            await Promise.all(responses.map((r) => r.text()));
          },
          serialP95CapMs: 300,
        },
        {
          name: 'server_error_handling (5 GET /fail 500 responses)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const res = await fetch(`${server.baseUrl}/fail`);
              await res.text();
            }
          },
          serialP95CapMs: 300,
        },
      ],
    });
    await server.close();
    expect(result.allPassed).toBe(true);
  });
});
