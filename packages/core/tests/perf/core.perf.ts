import { createPool, parseSpec } from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'core';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

const SAMPLE_SPEC = `# Sample spec

- id: sample-001
- layer: unit
- mode: mock

| priority | id | observation | given | when | then |
|---|---|---|---|---|---|
| P1 | c1 | first  | initial state | trigger action | expect success |
| P1 | c2 | second | edge case     | trigger action | expect failure |
| P2 | c3 | third  | boundary      | trigger action | expect noop    |
`;

describe(MODULE, () => {
  it(
    '3-layer perf: parseSpec + createPool primary paths',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            // parseSpec walks a 3-line meta block + 3-row table. Pure string
            // parsing, no I/O, targets the mock-invariant JS floor.
            name: 'parseSpec',
            serialP95CapMs: 5,
            fn: () => {
              parseSpec(SAMPLE_SPEC);
            },
          },
          {
            // createPool builds a size-4 pool where acquire() returns a fresh
            // object literal. Measures pool construction + Promise.all fan-out.
            name: 'createPool',
            serialP95CapMs: 5,
            fn: async () => {
              const pool = await createPool<{ id: number }>({
                size: 4,
                acquire: async () => ({ id: Math.random() }),
              });
              const lease = await pool.borrow();
              await lease.release();
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
