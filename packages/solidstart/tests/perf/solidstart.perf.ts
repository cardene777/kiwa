import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import {
  invokeServerFunction,
  invokeApiRoute,
  json,
  type ServerFunctionFunction,
  type APIRouteHandler,
} from '../../src/index.js';

const MODULE = 'solidstart';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (server function) + hydration (API route) primary paths',
    async () => {
      // SSR path: SolidStart server function runs on the server, can throw
      // redirect(). Measures env snapshot + result / redirect capture.
      const fn: ServerFunctionFunction<readonly [string], { ok: true; name: string }> = async (name) => ({
        ok: true,
        name,
      });

      // Hydration proxy: API route handler returns Response, captures redirect
      // + response snapshot.
      const handler: APIRouteHandler = async () => json({ ok: true });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — invokeServerFunction wraps request headers / cookies env,
            // awaits fn, decodes redirect signal.
            name: 'invokeServerFunction',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeServerFunction({ fn, args: ['kiwa'] });
            },
          },
          {
            // Hydration proxy — invokeApiRoute builds SimulatedAPIEvent, awaits
            // handler, captures Response + redirect.
            name: 'invokeApiRoute',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeApiRoute({ handler, url: 'http://localhost/api/health' });
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
