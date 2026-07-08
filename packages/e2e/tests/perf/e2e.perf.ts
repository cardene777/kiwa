import { startServer } from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'e2e';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: http server start + fetch handler primary paths',
    async () => {
      // One shared server across iterations: measures the fetch-handler
      // adapter cost (request → Response encode → node http response),
      // not the createServer + listen cost.
      const server = await startServer({
        kind: 'fetch',
        handler: async () =>
          new Response('{"ok":true}', {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        // HTTP socket round-trip is 10x slower than in-process code so we
        // relax iteration counts.
        serialIterations: 100,
        serialWarmup: 3,
        concurrency: 4,
        iterationsPerWorker: 25,
        memoryIterations: 100,
        ops: [
          {
            // Full loopback fetch cycle: connect + request encode + node
            // http server dispatch + fetch-handler adapter + Response
            // decode. Local socket, no network.
            name: 'fetchOverLoopback',
            serialP95CapMs: 20,
            fn: async () => {
              const res = await fetch(server.baseUrl);
              await res.text();
            },
          },
        ],
      });

      await server.close();
      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    180_000,
  );
});
