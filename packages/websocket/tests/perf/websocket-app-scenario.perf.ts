/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createWSServer, connectClient, broadcastMessage, encodeBinaryFrame, captureBinaryFrame } from '../../src/index.js';

const MODULE = 'websocket-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('websocket app scenario perf (real workload)', () => {
  it('3-layer perf: chat_room_workflow / broadcast_batch / binary_frame_error_handling', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'chat_room_workflow (10 send across 4 providers)',
          fn: async () => {
            const providers = ['ws', 'uwebsockets', 'socketio', 'colyseus'] as const;
            for (let i = 0; i < 10; i++) {
              const server = createWSServer({ provider: providers[i % 4] });
              const a = connectClient(server);
              connectClient(server);
              a.send(`msg-${i}`);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'broadcast_batch (5 rooms x 3 clients broadcast)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const server = createWSServer({ provider: 'socketio' });
              connectClient(server);
              connectClient(server);
              connectClient(server);
              broadcastMessage(server, { type: 'announce', data: { round: i } });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'binary_frame_batch (5 encode + parse round-trip)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const encoded = encodeBinaryFrame('binary', new Uint8Array([i, i + 1, i + 2]));
              captureBinaryFrame(encoded);
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
