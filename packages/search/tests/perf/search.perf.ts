import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  createAlgoliaMock,
  createMeilisearchMock,
  createTypesenseMock,
} from '../../src/index.js';

// SaaS layer baseline を .perf-baseline/saas/{name}.json に分離 (v1.25-4)。
const MODULE = 'search';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/saas', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/saas', `${MODULE}.json`);

interface SearchDoc {
  id: string;
  title: string;
  category: string;
}

const seedDocs: SearchDoc[] = Array.from({ length: 20 }, (_, i) => ({
  id: `d${i}`,
  title: `kiwa release gate ${i}`,
  category: i % 2 === 0 ? 'testing' : 'infra',
}));

describe(MODULE, () => {
  it(
    '3-layer perf: 3 provider (Meilisearch / Algolia / Typesense) search + addDocuments primary paths',
    async () => {
      const meili = createMeilisearchMock({ typoTolerance: false });
      const algolia = createAlgoliaMock({ typoTolerance: false });
      const typesense = createTypesenseMock();

      // Seed once — search ops read from a stable index. addDocuments ops
      // append with unique ids per iteration so we measure insert cost, not
      // dedup fast path.
      await meili.addDocuments('docs', seedDocs);
      await algolia.addDocuments('docs', seedDocs);
      await typesense.addDocuments('docs', seedDocs);
      let addCounter = 0;

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // Meilisearch search — ranked by word overlap, includes facet count.
            // Real prod path uses Meilisearch HTTP API — mock exercises the
            // same tokenize + rank + slice pipeline.
            name: 'meiliSearchQuery',
            serialP95CapMs: 10,
            fn: async () => {
              const r = await meili.search('docs', { q: 'kiwa release' });
              if (r.hits.length === 0) throw new Error('no hits');
            },
          },
          {
            // Algolia search — same tokenize + rank shape as Meilisearch.
            name: 'algoliaSearchQuery',
            serialP95CapMs: 10,
            fn: async () => {
              const r = await algolia.search('docs', { q: 'kiwa release' });
              if (r.hits.length === 0) throw new Error('no hits');
            },
          },
          {
            // Typesense search — same shape, exact-match ranked.
            name: 'typesenseSearchQuery',
            serialP95CapMs: 10,
            fn: async () => {
              const r = await typesense.search('docs', { q: 'kiwa' });
              if (r.hits.length === 0) throw new Error('no hits');
            },
          },
          {
            // Meilisearch addDocuments — write path. Unique id per iteration
            // avoids dedup fast path.
            name: 'meiliAddDocuments',
            serialP95CapMs: 10,
            fn: async () => {
              addCounter += 1;
              await meili.addDocuments('docs', [
                { id: `add-${addCounter}`, title: 'perf', category: 'testing' },
              ]);
            },
          },
          {
            // Algolia addDocuments — write path.
            name: 'algoliaAddDocuments',
            serialP95CapMs: 10,
            fn: async () => {
              addCounter += 1;
              await algolia.addDocuments('docs', [
                { id: `add-${addCounter}`, title: 'perf', category: 'testing' },
              ]);
            },
          },
          {
            // Typesense addDocuments — write path.
            name: 'typesenseAddDocuments',
            serialP95CapMs: 10,
            fn: async () => {
              addCounter += 1;
              await typesense.addDocuments('docs', [
                { id: `add-${addCounter}`, title: 'perf', category: 'testing' },
              ]);
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
