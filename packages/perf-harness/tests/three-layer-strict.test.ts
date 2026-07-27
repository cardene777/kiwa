import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { runPerf3LayerStrict } from '../src/index.js';

describe('runPerf3LayerStrict — v0.3 strict variant', () => {
  // 固定 directory を共有すると、各 case 末尾の削除が別 case の書込みと重なり、
  // 途中状態の baseline を読んで "Unexpected end of JSON input" で落ちる。
  // case ごとに独立した directory を作る。
  const created: string[] = [];

  function tempDir(): string {
    const dir = mkdtempSync(join(os.tmpdir(), 'perf-harness-strict-'));
    created.push(dir);
    return dir;
  }

  afterEach(() => {
    while (created.length > 0) {
      const dir = created.pop();
      if (dir) rmSync(dir, { recursive: true, force: true });
    }
  });

  it('applies strict defaults (iter 400 + concurrency 20 + memory 400)', async () => {
    const tmpDir = tempDir();
    const result = await runPerf3LayerStrict({
      moduleName: 'strict-test',
      ops: [
        {
          name: 'noop',
          fn: () => {},
          serialP95CapMs: 1000,
        },
      ],
      reportPath: join(tmpDir, 'report.md'),
      baselinePath: join(tmpDir, 'baseline.json'),
    });
    expect(result.outcomes).toHaveLength(1);
    const outcome = result.outcomes[0]!;
    expect(outcome.serial.iterations).toBe(400);
    expect(outcome.concurrent.iterations).toBe(2000); // concurrency 20 × iter 100
    expect(outcome.memory.iterationCount).toBe(400);
  });

  it('accepts explicit overrides', async () => {
    const tmpDir = tempDir();
    const result = await runPerf3LayerStrict({
      moduleName: 'strict-test-override',
      ops: [
        {
          name: 'noop',
          fn: () => {},
          serialP95CapMs: 1000,
        },
      ],
      reportPath: join(tmpDir, 'report.md'),
      baselinePath: join(tmpDir, 'baseline.json'),
      serialIterations: 50,
      concurrency: 5,
      memoryIterations: 100,
    });
    expect(result.outcomes[0]!.serial.iterations).toBe(50);
    expect(result.outcomes[0]!.memory.iterationCount).toBe(100);
  });

  it('strict + regression detection works together', async () => {
    const tmpDir = tempDir();
    // First run seeds baseline
    const first = await runPerf3LayerStrict({
      moduleName: 'strict-regression',
      ops: [
        {
          name: 'noop',
          fn: () => {},
          serialP95CapMs: 1000,
        },
      ],
      reportPath: join(tmpDir, 'r.md'),
      baselinePath: join(tmpDir, 'b.json'),
      serialIterations: 30,
      concurrency: 3,
      memoryIterations: 30,
    });
    expect(first.baselineSeeded).toBe(true);
  });
});
