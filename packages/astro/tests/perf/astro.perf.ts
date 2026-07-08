import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import {
  invokeEndpoint,
  renderAstroPage,
  type APIRoute,
} from '../../src/index.js';

const MODULE = 'astro';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (page render) + hydration (endpoint) primary paths',
    async () => {
      // SSR path: Astro page returns HTML string or Response for the initial
      // render. Measures SimulatedAstroContext build + page await + wrap.
      const page = () => '<h1>hello</h1>';

      // Hydration proxy: Astro endpoint (API route) handles HTTP verbs and
      // returns Response. Same wrap cost as page.
      const endpoint: APIRoute = async () =>
        new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' },
        });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — renderAstroPage builds context, awaits page, captures
            // redirect / notFound / rewrite signal + response snapshot.
            name: 'renderAstroPage',
            serialP95CapMs: 5,
            fn: async () => {
              await renderAstroPage({
                page,
                url: 'https://x/',
              });
            },
          },
          {
            // Hydration proxy — invokeEndpoint builds SimulatedAPIContext,
            // awaits endpoint, captures redirect + response.
            name: 'invokeEndpoint',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeEndpoint({
                endpoint,
                url: 'http://localhost/api/health',
              });
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
