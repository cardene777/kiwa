import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import {
  invokeLoad,
  invokeAction,
  type LoadFunction,
  type ActionFunction,
} from '../../src/index.js';

const MODULE = 'sveltekit';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (load) + hydration (form action) primary paths',
    async () => {
      // SSR path: +page.server.ts load returns data, feeds hydration.
      // Measures URL parse + SimulatedLoadEvent build + env capture.
      const load: LoadFunction<{ msg: string }> = async () => ({ msg: 'hello' });

      // Hydration path: form action processes POST body (FormData) and returns
      // a result. Measures action wrap + env snapshot.
      const action: ActionFunction<{ ok: boolean }> = async () => ({ ok: true });

      const fd = new FormData();
      fd.set('name', 'kiwa');

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — invokeLoad captures redirect / error signals + response
            // headers / cookies + status. Serial cap tuned to JS floor.
            name: 'invokeLoad',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeLoad({
                load,
                url: 'http://localhost/x',
              });
            },
          },
          {
            // Hydration — form action awaits + captures env (redirect / fail /
            // response headers / cookies).
            name: 'invokeAction',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeAction({
                action,
                url: 'http://localhost/x',
                formData: fd,
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
