import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  connectClientToServer,
  McpServer,
  registerAllFixtureTools,
  registerEcho,
  ToolRegistry,
  textContent,
} from '../../src/index.js';

// SaaS layer baseline を .perf-baseline/saas/{name}.json に分離 (v1.25-4)。
const MODULE = 'mcp';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/saas', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/saas', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: MCP server / client handshake + tools/list + tools/call + registry primary paths',
    async () => {
      // Long-lived server + client. Handshake is one-time (real MCP prod:
      // JSON-RPC initialize), we measure per-request latency.
      const server = new McpServer({ name: 'perf-server', version: '0.0.0-perf' });
      registerAllFixtureTools(server);
      const { client } = await connectClientToServer(server, {
        name: 'perf-client',
        version: '0.0.0-perf',
      });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // MCP tools/list — JSON-RPC request/response over in-memory transport.
            // Real prod path is stdio transport — mock exercises the same
            // dispatch + serialize path (JSON encode/decode elided).
            name: 'mcpListTools',
            serialP95CapMs: 10,
            fn: async () => {
              const tools = await client.listTools();
              if (tools.length === 0) throw new Error('no tools');
            },
          },
          {
            // MCP tools/call echo — JSON-RPC request with args + handler dispatch.
            name: 'mcpCallEcho',
            serialP95CapMs: 10,
            fn: async () => {
              const r = await client.callTool('echo', { message: 'perf' });
              if (r.isError) throw new Error('echo failed');
            },
          },
          {
            // MCP tools/call calc — dispatch + math + text content serialize.
            name: 'mcpCallCalc',
            serialP95CapMs: 10,
            fn: async () => {
              const r = await client.callTool('calc', { op: 'add', a: 2, b: 3 });
              if (r.isError) throw new Error('calc failed');
            },
          },
          {
            // ToolRegistry.register — insertion order preserved, Map set.
            name: 'toolRegistryRegister',
            serialP95CapMs: 5,
            fn: () => {
              const r = new ToolRegistry();
              r.register(
                { name: 'perf', description: '', inputSchema: { type: 'object' } },
                () => [textContent('ok')],
              );
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
