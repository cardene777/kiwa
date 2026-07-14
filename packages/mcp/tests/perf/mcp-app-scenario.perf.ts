/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { McpServer, textContent, validateSchema } from '../../src/index.js';

const MODULE = 'mcp-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('mcp app scenario perf (real workload)', () => {
  it('3-layer perf: tool registration burst / schema validate loop / lifecycle', async () => {
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
          name: 'tool_registration_burst (server + 20 register)',
          fn: () => {
            const server = new McpServer({ requireHandshake: false });
            for (let i = 0; i < 20; i++) {
              server.register(
                { name: `t-${i}`, description: 't', inputSchema: { type: 'object' } },
                async () => [textContent(`r-${i}`)],
              );
            }
            if (server.toolCount !== 20) throw new Error(`unexpected count`);
          },
          serialP95CapMs: 30,
        },
        {
          name: 'schema_validate_loop (50 validateSchema)',
          fn: () => {
            const schema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } as const;
            for (let i = 0; i < 50; i++) validateSchema(schema, { name: `n-${i}` });
          },
          serialP95CapMs: 30,
        },
        {
          name: 'server_lifecycle (register + unregister × 10 cycle)',
          fn: () => {
            const server = new McpServer({ requireHandshake: false });
            for (let i = 0; i < 10; i++) {
              server.register(
                { name: `l-${i}`, description: 't', inputSchema: { type: 'object' } },
                async () => [textContent('x')],
              );
              server.unregister(`l-${i}`);
            }
          },
          serialP95CapMs: 30,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
