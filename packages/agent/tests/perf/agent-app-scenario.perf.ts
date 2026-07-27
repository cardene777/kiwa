/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AssistantsClient, toolCall } from '../../src/index.js';

const MODULE = 'agent-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('agent app scenario perf (real workload)', () => {
  it('3-layer perf: assistant run cycle / multi-thread conversation / tool_call chain', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'assistant_run_cycle (create + thread + run + poll)',
          fn: async () => {
            const client = new AssistantsClient({ idSeed: `s-${Math.random()}` });
            const a = client.createAssistant({
              name: 'a',
              instructions: 'test',
              handler: async () => ({ kind: 'message', content: 'done' }),
            });
            const t = client.createThread();
            client.addMessage(t.id, { role: 'user', content: 'q' });
            const r = client.createRun({ threadId: t.id, assistantId: a.id });
            await client.poll(r.id);
          },
          serialP95CapMs: 50,
        },
        {
          name: 'multi_thread_conversation (5 thread × 3 message)',
          fn: async () => {
            const client = new AssistantsClient({ idSeed: `m-${Math.random()}` });
            const a = client.createAssistant({
              name: 'a',
              instructions: 'test',
              handler: async () => ({ kind: 'message', content: 'reply' }),
            });
            for (let i = 0; i < 5; i++) {
              const t = client.createThread();
              for (let j = 0; j < 3; j++) client.addMessage(t.id, { role: 'user', content: `q-${j}` });
              const r = client.createRun({ threadId: t.id, assistantId: a.id });
              await client.poll(r.id);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'tool_call_chain (10 toolCall build)',
          fn: () => {
            for (let i = 0; i < 10; i++) {
              toolCall({ id: `c-${i}`, name: 'fn', arguments: { i, str: `s-${i}` } });
            }
          },
          serialP95CapMs: 30,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
