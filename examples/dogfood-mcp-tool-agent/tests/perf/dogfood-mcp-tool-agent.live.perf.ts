import { resolveKiwaRepoRoot, runPerf3LayerLive } from '@kiwa-test/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../../src/adapters/real.js';
import { performHandshakeAndDiscover } from '../../src/flows/agent-flows.js';

const MODULE = 'dogfood-mcp-tool-agent';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.live.md`,
);

describe(`${MODULE} — live`, () => {
  it(
    '3-layer LIVE perf: handshake via real @modelcontextprotocol/sdk + real Anthropic (env-skip when ANTHROPIC_API_KEY absent)',
    async () => {
      // Reuse the same real adapter across iterations so stdio child spawn +
      // DNS + HTTPS keep-alive amortise naturally — matches how a live agent
      // handler would behave in production.
      const adapter = makeRealAdapter();

      const result = await runPerf3LayerLive({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'handshake.live',
            // Live threshold — spawning a stdio MCP server + JSON-RPC
            // initialize + Anthropic warmup is slower than a pure text
            // call, so we allow ~3500ms serial p95.
            serialP95CapMs: 3500,
            requiredEnv: ['ANTHROPIC_API_KEY'],
            fn: async () => {
              try {
                await performHandshakeAndDiscover(adapter);
              } catch (err) {
                // MCP_REAL_ENV_MISSING should never fire here (requiredEnv
                // guarded above). Any other error is a real spawn / network
                // failure and re-thrown so the perf run surfaces it.
                if (err instanceof Error && err.message.includes('ENV_MISSING')) return;
                throw err;
              }
            },
          },
        ],
      });

      // Live runs pass when env is missing (skipped state is expected in
      // CI-less environments). When env is present all gates must pass.
      const measured = result.outcomes.filter((o) => !o.skipped);
      if (measured.length > 0) {
        for (const outcome of measured) {
          expect.soft(outcome.serialGatePassed, `${outcome.name} live serial p95`).toBe(true);
        }
        expect(result.allPassed).toBe(true);
      } else {
        // No env: report is emitted with LIVE_ENV_MISSING marker.
        expect(result.anySkipped).toBe(true);
      }
    },
    600_000,
  );
});
