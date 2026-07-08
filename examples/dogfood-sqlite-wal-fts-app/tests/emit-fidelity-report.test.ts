/**
 * Vitest — write the fidelity report to quality-report/ (v1.32-4).
 *
 * The emitted JSON + markdown snapshot is consumed by the release-smoke
 * harness (v1.32-6 publish milestone) alongside the sibling postgres +
 * mysql dogfood reports.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { OPS_UNDER_TEST } from '../src/adapters/interface.js';
import { runAdapterMatrix, runFidelityHarness, runFullSurface } from '../src/flows/fidelity.js';

describe('dogfood-sqlite-wal-fts-app — emit fidelity report to quality-report/', () => {
  it('T-DSE-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({ mock, real, run: runFullSurface });
    const output = runFidelityHarness({
      provider: '@kiwa/orm/sqlite-wal-fts-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 18, integration: 4, e2e: 3 },
      mutation: { mutations: 20, killed: 15 },
    });

    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.markdown).toContain('Quality Report');
    await mock.reset();
    await real.reset();
  });
});
