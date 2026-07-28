/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SearchEngine } from '../../src/index.js';

const MODULE = 'search-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('search app scenario perf (real workload)', () => {
  it('3-layer perf: index build / search-heavy / filter+search', async () => {
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
          name: 'index_build (100 docs addDocuments + 10 search)',
          fn: async () => {
            const engine = new SearchEngine({ provider: 'meilisearch' });
            const docs = Array.from({ length: 100 }, (_, i) => ({ id: `d-${i}`, title: `doc ${i} kiwa` }));
            await engine.addDocuments('idx', docs);
            for (let i = 0; i < 10; i++) await engine.search('idx', { q: 'kiwa' });
          },
          serialP95CapMs: 100,
        },
        {
          name: 'search_heavy_workload (50 docs + 50 search)',
          fn: async () => {
            const engine = new SearchEngine({ provider: 'algolia' });
            const docs = Array.from({ length: 50 }, (_, i) => ({ id: `s-${i}`, title: `item ${i}` }));
            await engine.addDocuments('idx', docs);
            for (let i = 0; i < 50; i++) await engine.search('idx', { q: `item ${i % 10}` });
          },
          serialP95CapMs: 100,
        },
        {
          name: 'filter_search_cycle (20 docs + 20 filtered search)',
          fn: async () => {
            const engine = new SearchEngine({ provider: 'typesense' });
            const docs = Array.from({ length: 20 }, (_, i) => ({ id: `f-${i}`, title: 'kiwa', tag: i % 2 === 0 ? 'a' : 'b' }));
            await engine.addDocuments('idx', docs);
            for (let i = 0; i < 20; i++) await engine.search('idx', { q: 'kiwa', filter: { tag: i % 2 === 0 ? 'a' : 'b' } });
          },
          serialP95CapMs: 80,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
