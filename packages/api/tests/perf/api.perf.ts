import { createRequestClient } from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'api';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: request client primary paths',
    async () => {
      // Stub fetcher returns a fresh Response per call. The perf target is the
      // URL join + body encode + Response snapshot pipeline inside
      // createRequestClient, not the underlying HTTP round-trip.
      const stubFetch: typeof fetch = async (_input, _init) =>
        new Response('{"ok":true}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      const client = createRequestClient({
        baseUrl: 'http://localhost:3000',
        defaultHeaders: { 'x-test': '1' },
        fetcher: stubFetch,
      });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            // GET path: url join + header merge + Response snapshot capture.
            name: 'requestClientGet',
            serialP95CapMs: 5,
            fn: async () => {
              await client.get('/users');
            },
          },
          {
            // POST path adds body encode (JSON.stringify + content-type).
            name: 'requestClientPost',
            serialP95CapMs: 5,
            fn: async () => {
              await client.post('/users', { name: 'alice', id: 1 });
            },
          },
        ],
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );
});
