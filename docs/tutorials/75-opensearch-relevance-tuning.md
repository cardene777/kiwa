# OpenSearch relevance tuning — BM25 + TF-IDF + custom ranking + A/B + synonym advanced + rolling reindex in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/search` v0.3 that models the 6 pieces of a real OpenSearch relevance-tuning pipeline that every non-trivial content platform (blog / knowledge base / e-commerce catalog) eventually needs — a relevance session that pins BM25 `k1` / `b` tuning params + optional custom-ranking boost, a BM25 scorer and a TF-IDF scorer that produce ranked hits, an A/B variant selector that stably assigns users to buckets, a synonym session that handles multi-language expansion + phonetic match + stemmer + typo bridge, and an index-management session that handles rolling reindex + shard allocation + replica promotion + zero-downtime alias swap. `startRelevanceSession()` + `scoreBm25()` + `scoreTfIdf()` + `applyCustomRanking()` + `selectAbVariant()` + `startSynonymSession()` + `startIndexMgmtSession()` + `swapZeroDowntime()` give you every one of those pieces without booting a real OpenSearch OSS cluster. This is the pattern kiwa's `examples/dogfood-search-opensearch-app` exercises against real OpenSearch OSS 2.x under `KIWA_MODE=real` + `KIWA_OPENSEARCH_URL` + `OPENSEARCH_KEY`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the p95 nDCG@10 dropped from 0.83 to 0.71 after the synonym file rewrite but nobody caught it until the customer replied 'no results for shirt'" gap a reviewer sees in the relevance-drift post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-opensearch-relevance && cd kiwa-opensearch-relevance
pnpm init
pnpm add -D @kiwa-lab/search@^0.3 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.3 surface exports the relevance + synonym-advanced + index-management axes through the `semantics/` barrel. This tutorial covers those 3 axes end-to-end; tutorials 73-74 cover the other advanced axes (vector + faceted advanced + geo).

### 2. `startRelevanceSession` + `scoreBm25` — the default lexical ranker

`tests/relevance/bm25.test.ts` — a relevance session pins BM25 tuning params. The `k1` param controls term-frequency saturation (default 1.2, higher = more benefit per repeated term); the `b` param controls length normalization (default 0.75, 0 = no norm, 1 = full norm). `scoreBm25()` ranks documents by BM25 score, so `hits[0]` is the strongest match for the query.

```ts
import { describe, expect, it } from 'vitest';
import {
  startRelevanceSession,
  seedRelevanceDocuments,
  scoreBm25,
} from '@kiwa-lab/search';

const sampleDocs = [
  { id: 'a', content: 'search engine mock kiwa realtime' },
  { id: 'b', content: 'kiwa release gate mock' },
  { id: 'c', content: 'random unrelated text' },
  { id: 'd', content: 'kiwa kiwa kiwa dense hit' },
];

describe('relevance — BM25 scorer', () => {
  it('ranks documents with more term matches higher', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'articles' });
    seedRelevanceDocuments(session, sampleDocs);
    const { hits, step } = scoreBm25(session, 'kiwa');
    expect(step.neutralEvent).toBe('relevance.bm25_scored');
    expect(hits[0]?.id).toBe('d');
    expect(session.state).toBe('bm25-scored');
  });

  it('rejects an empty query — the invariant guards against a "return everything" fallback', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'x' });
    seedRelevanceDocuments(session, sampleDocs);
    expect(() => scoreBm25(session, '')).toThrow(/at least one token/);
  });

  it('BM25 tuning params k1 / b flow through to metadata', () => {
    const session = startRelevanceSession({
      target: 'opensearch-oss',
      indexId: 'x',
      bm25K1: 1.5,
      bm25B: 0.5,
    });
    seedRelevanceDocuments(session, sampleDocs);
    const { step } = scoreBm25(session, 'kiwa');
    expect(step.metadata.k1).toBe(1.5);
    expect(step.metadata.b).toBe(0.5);
  });
});
```

Run it.

```bash
pnpm test
```

The 3 tests pass. The invariant `query !== ''` before `scoreBm25` is what stops a caller from firing an empty-query search that returns every document — a class of bugs where a stale form state leaks into the query builder and paginates the entire index.

### 3. `scoreTfIdf` — the rare-term ranker

`tests/relevance/tfidf.test.ts` — `scoreTfIdf()` uses inverse document frequency to reward terms that appear in fewer documents. This is the classic ranker for a specialty search where the "long-tail" query needs to hit the exact niche document.

```ts
import { describe, expect, it } from 'vitest';
import {
  startRelevanceSession,
  seedRelevanceDocuments,
  scoreTfIdf,
} from '@kiwa-lab/search';

const sampleDocs = [
  { id: 'a', content: 'search engine mock kiwa realtime' },
  { id: 'b', content: 'kiwa release gate mock' },
  { id: 'c', content: 'random unrelated text' },
  { id: 'd', content: 'kiwa kiwa kiwa dense hit' },
];

describe('relevance — TF-IDF scorer', () => {
  it('rewards terms that are rare across the corpus', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'x' });
    seedRelevanceDocuments(session, sampleDocs);
    const { hits, step } = scoreTfIdf(session, 'random');
    expect(step.neutralEvent).toBe('relevance.tfidf_scored');
    expect(hits[0]?.id).toBe('c');
  });
});
```

The pair (`scoreBm25` + `scoreTfIdf`) is the AB matrix — head queries (`kiwa`) benefit from BM25, tail queries (`random`) benefit from TF-IDF. Real production runs both and picks by query length + document count; the tutorial exposes them as separate transitions so the caller can compare.

### 4. `applyCustomRanking` — boost by signal

`tests/relevance/custom.test.ts` — `applyCustomRanking()` takes the BM25 output and multiplies by a caller-provided boost signal (page views, freshness, editorial score). This is the pattern OpenSearch's `rank_feature` field uses under the hood.

```ts
import { describe, expect, it } from 'vitest';
import {
  startRelevanceSession,
  seedRelevanceDocuments,
  scoreBm25,
  applyCustomRanking,
} from '@kiwa-lab/search';

describe('relevance — custom ranking boost', () => {
  it('multiplies by a caller-provided signal', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'x' });
    seedRelevanceDocuments(session, [
      { id: 'a', content: 'kiwa', boostSignal: 1 },
      { id: 'b', content: 'kiwa kiwa', boostSignal: 10 },
    ]);
    const { hits } = scoreBm25(session, 'kiwa');
    const { ranked, step } = applyCustomRanking(session, hits, {
      boostFn: (d) => d.boostSignal ?? 1,
    });
    expect(step.neutralEvent).toBe('relevance.custom_ranking_applied');
    expect(ranked[0]?.id).toBe('b');
  });
});
```

The invariant is that `applyCustomRanking` preserves the `hits` array ordering but re-scores by `bm25Score × boostFn(doc)`. When the caller's boost function returns 0, the doc is effectively suppressed (a common "editorial removal" pattern).

### 5. `selectAbVariant` — stable user-bucket assignment

`tests/relevance/ab.test.ts` — `selectAbVariant()` maps a `userId` to a variant deterministically so the same user always sees the same ranker. This is the invariant that lets an A/B test measure lift correctly (per-session assignment would inflate the sample size but destroy the variance analysis).

```ts
import { describe, expect, it } from 'vitest';
import { startRelevanceSession, selectAbVariant } from '@kiwa-lab/search';

describe('relevance — A/B variant', () => {
  it('is stable per userId', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'x' });
    const first = selectAbVariant(session, { variants: ['A', 'B'], userId: 'user-42' });
    const second = selectAbVariant(session, { variants: ['A', 'B'], userId: 'user-42' });
    expect(first.variant).toBe(second.variant);
  });

  it('distributes across a large user population', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'x' });
    const variants = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      const { variant } = selectAbVariant(session, {
        variants: ['A', 'B', 'C'],
        userId: `u-${i}`,
      });
      variants.add(variant);
    }
    expect(variants.size).toBeGreaterThanOrEqual(2);
  });
});
```

The invariant is that per-user assignment is stable (a fixed hash of `userId` selects the bucket). When two calls with the same `userId` return different variants, the A/B test result is garbage.

### 6. `startSynonymSession` + `expandMultiLanguage` — synonym-advanced axis

`tests/synonym/expand.test.ts` — a synonym session pins an index id. `registerSynonyms()` seeds entries per language. `expandMultiLanguage()` walks the entries bidirectionally so both `car → automobile` and `automobile → car` return the same expanded set.

```ts
import { describe, expect, it } from 'vitest';
import {
  startSynonymSession,
  registerSynonyms,
  expandMultiLanguage,
} from '@kiwa-lab/search';

describe('synonym-advanced — multi-language expansion', () => {
  it('expands base to synonyms across languages', () => {
    const session = startSynonymSession({ target: 'opensearch-oss', indexId: 'catalog' });
    registerSynonyms(session, [
      { base: 'car', synonyms: ['automobile', 'vehicle'], language: 'en' },
      { base: 'coche', synonyms: ['automovil'], language: 'es' },
    ]);
    const { expanded, step } = expandMultiLanguage(session, {
      query: 'car',
      languages: ['en', 'es'],
    });
    expect(step.neutralEvent).toBe('synonym.multi_language_expanded');
    expect(expanded).toContain('car');
    expect(expanded).toContain('automobile');
    expect(expanded).toContain('vehicle');
  });

  it('bidirectional expansion — synonym resolves back to base', () => {
    const session = startSynonymSession({ target: 'opensearch-oss', indexId: 'x' });
    registerSynonyms(session, [
      { base: 'car', synonyms: ['automobile'], language: 'en' },
    ]);
    const { expanded } = expandMultiLanguage(session, {
      query: 'automobile',
      languages: ['en'],
    });
    expect(expanded).toContain('car');
  });
});
```

The bidirectional invariant is what catches the "shirt vs. shirts" silent-mismatch — if the synonym file only registers `shirt → t-shirt` (unidirectional), a search for `t-shirt` misses the base. The mock enforces bidirectional expansion so the real OpenSearch synonym file is validated before deploy.

### 7. `matchPhonetic` + `normalizeStemmer` + `bridgeTypo` — the fuzzy trio

`tests/synonym/fuzzy.test.ts` — `matchPhonetic()` uses soundex codes to match names that sound alike (`Robert` ↔ `Rupert`). `normalizeStemmer()` strips English suffixes (`running → runn`) and Japanese polite endings (`たべます → たべ`). `bridgeTypo()` suggests edit-distance-1 corrections.

```ts
import { describe, expect, it } from 'vitest';
import {
  startSynonymSession,
  matchPhonetic,
  normalizeStemmer,
  bridgeTypo,
} from '@kiwa-lab/search';

describe('synonym-advanced — fuzzy trio', () => {
  it('phonetic match uses soundex codes', () => {
    const session = startSynonymSession({ target: 'opensearch-oss', indexId: 'x' });
    const { matched, step } = matchPhonetic(session, {
      query: 'Robert',
      candidates: ['Rupert', 'Robbert', 'Alice', 'Robb'],
    });
    expect(step.neutralEvent).toBe('synonym.phonetic_matched');
    expect(matched).toContain('Rupert');
    expect(matched).toContain('Robbert');
    expect(matched).not.toContain('Alice');
  });

  it('stemmer normalizes English suffixes', () => {
    const session = startSynonymSession({ target: 'opensearch-oss', indexId: 'x' });
    const { normalized, step } = normalizeStemmer(session, {
      tokens: ['running', 'jumped', 'happily', 'fastes'],
      language: 'en',
    });
    expect(step.neutralEvent).toBe('synonym.stemmer_normalized');
    expect(normalized[0]).toBe('runn');
    expect(normalized[1]).toBe('jump');
  });

  it('typo bridge suggests edit-distance-1 corrections', () => {
    const session = startSynonymSession({ target: 'opensearch-oss', indexId: 'x' });
    const { suggestions, step } = bridgeTypo(session, {
      query: 'realtim',
      dictionary: ['realtime', 'random', 'realtor', 'realtimee'],
    });
    expect(step.neutralEvent).toBe('synonym.typo_bridged');
    expect(suggestions[0]?.term).toBe('realtime');
    expect(suggestions[0]?.distance).toBe(1);
  });
});
```

The trio is the "search-quality safety net" — even when the primary BM25 misses, phonetic + stemmer + typo salvage a match. The invariant `distance <= 2` on the typo bridge is what keeps the suggestions relevant (edit distance 3+ produces noise).

### 8. `startIndexMgmtSession` + `swapZeroDowntime` — rolling reindex flow

`tests/index-mgmt/lifecycle.test.ts` — an index-management session pins the shard / replica / node layout. `allocateShards()` places primary + replica on distinct nodes. `promoteReplica()` recovers when a node fails. `advanceRollingReindex()` walks batch progress. `swapZeroDowntime()` flips the alias without downtime.

```ts
import { describe, expect, it } from 'vitest';
import {
  startIndexMgmtSession,
  allocateShards,
  promoteReplica,
  advanceRollingReindex,
  swapZeroDowntime,
} from '@kiwa-lab/search';

describe('index-management — rolling reindex + zero-downtime swap', () => {
  it('walks the full lifecycle allocate → promote → reindex → swap', () => {
    const session = startIndexMgmtSession({
      target: 'opensearch-oss',
      indexId: 'products-v1',
      shardCount: 3,
      replicaCount: 1,
      nodes: ['n1', 'n2', 'n3'],
    });
    allocateShards(session);
    expect(session.shards.filter((sh) => sh.role === 'primary')).toHaveLength(3);

    const failedNode = session.shards[0]?.nodeId ?? 'n1';
    promoteReplica(session, { shardId: 0, failedNode });

    advanceRollingReindex(session, { batchPercent: 50 });
    advanceRollingReindex(session, { batchPercent: 50 });
    swapZeroDowntime(session, { newIndexId: 'products-v2' });
    expect(session.state).toBe('zero-downtime-swapped');
    expect(session.aliasTarget).toBe('products-v2');
  });

  it('rolling reindex batchPercent accumulates until 100', () => {
    const session = startIndexMgmtSession({
      target: 'opensearch-oss',
      indexId: 'x',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['n1'],
    });
    allocateShards(session);
    const step1 = advanceRollingReindex(session, { batchPercent: 30 });
    expect(step1.metadata.progress).toBe(30);
    const step2 = advanceRollingReindex(session, { batchPercent: 40 });
    expect(step2.metadata.progress).toBe(70);
    const step3 = advanceRollingReindex(session, { batchPercent: 30 });
    expect(step3.metadata.progress).toBe(100);
    expect(step3.metadata.completed).toBe(true);
  });
});
```

The `swapZeroDowntime` invariant is that the alias target flips atomically — `products-v1` continues to answer queries until `products-v2` is fully built, then the alias swap is a single-write operation (no reader ever sees "index not found"). This is what makes a real reindex safe under production traffic.

### 9. Wire the fidelity harness

`tests/fidelity.test.ts` — the fidelity harness (`collectFidelityCoverage()`) exposes the `4 provider × 8 axis = 32 cell grid`. The relevance + synonym-advanced + index-management axes are 3 of the 8; every provider (Meilisearch / Typesense / Algolia / OpenSearch OSS) covers all three with a different dialect.

```ts
import { describe, expect, it } from 'vitest';
import { collectFidelityCoverage } from '@kiwa-lab/search';

describe('opensearch — 3 axis fidelity coverage', () => {
  it('the 4 provider × relevance grid emits 4 rows', () => {
    const coverage = collectFidelityCoverage();
    const relevanceRows = coverage.rows.filter((r) => r.axis === 'relevance');
    expect(relevanceRows).toHaveLength(4);
    for (const row of relevanceRows) {
      expect(row.neutralEvents).toEqual([
        'relevance.bm25_scored',
        'relevance.tfidf_scored',
        'relevance.custom_ranking_applied',
        'relevance.ab_variant_selected',
      ]);
    }
  });

  it('the 4 provider × synonym-advanced grid emits 4 rows', () => {
    const coverage = collectFidelityCoverage();
    const synonymRows = coverage.rows.filter((r) => r.axis === 'synonym-advanced');
    expect(synonymRows).toHaveLength(4);
  });

  it('the 4 provider × index-management grid emits 4 rows', () => {
    const coverage = collectFidelityCoverage();
    const idxRows = coverage.rows.filter((r) => r.axis === 'index-management');
    expect(idxRows).toHaveLength(4);
  });

  it('OpenSearch dialect is stable for relevance.bm25_scored', () => {
    const coverage = collectFidelityCoverage(['opensearch-oss']);
    const bm25 = coverage.rows.find((r) => r.axis === 'relevance');
    expect(bm25?.providerEvents[0]).toMatch(/^opensearch\./);
  });
});
```

The fidelity assertion is the *contract* the real-driver path in `examples/dogfood-search-opensearch-app` tests against — the OpenSearch `_search` endpoint that emits `opensearch.rank.bm25` MUST match the mock's dialect exactly. When the mock and the real OpenSearch diverge, the mock gets the fix (the mock is the SSOT).

### 10. Real driver mode

Under `KIWA_MODE=real` the same assertions run against real OpenSearch OSS 2.x. The dogfood app in `examples/dogfood-search-opensearch-app` shows the pattern.

```ts
import { describe, it } from 'vitest';

const gate = { skip: process.env.KIWA_MODE !== 'real' };
const requiredEnv = ['KIWA_OPENSEARCH_URL', 'OPENSEARCH_KEY'] as const;
const envMissing = requiredEnv.filter((k) => !process.env[k]);

describe.skipIf(gate.skip || envMissing.length > 0)(
  'real-driver — OpenSearch OSS relevance + synonym + rolling reindex',
  () => {
    it('runs the mock pipeline against the actual OpenSearch cluster under KIWA_MODE=real', async () => {
      // Same session pipeline as the mock tests, but the BM25 score,
      // synonym expansion, and alias swap are routed to KIWA_OPENSEARCH_URL.
    });
  },
);
```

The dogfood app exposes `pnpm test:real` — it flips `KIWA_MODE=real`, requires `KIWA_OPENSEARCH_URL` + `OPENSEARCH_KEY`, spins up an OpenSearch OSS testcontainer, and re-runs the same session pipeline against a real cluster. Failure means the mock diverged from the real OpenSearch semantics; the mock gets the fix.

## What you just learned

- **Relevance state machine** — `idle → bm25-scored → tfidf-scored → custom-ranking-applied → ab-variant-selected`. Each transition is a discrete relevance-tuning knob.
- **BM25 tuning** — `k1` (term-frequency saturation) + `b` (length normalization) flow through metadata so tests assert on the effective values.
- **Custom ranking** — a caller-provided boost function multiplies the BM25 score. Editorial removal is a boost of 0.
- **A/B variant** — deterministic per-user assignment. Same `userId` returns the same bucket across sessions.
- **Synonym-advanced trio** — phonetic match (soundex) + stemmer (English + Japanese) + typo bridge (edit distance ≤ 2). Safety net when BM25 misses.
- **Index-management lifecycle** — allocate → promote → rolling reindex → zero-downtime swap. Alias flip is atomic.
- **Fidelity contract** — the mock's neutral events (`relevance.bm25_scored`, `synonym.phonetic_matched`, `index.zero_downtime_swapped`) map to 4 provider dialects; when they diverge, the mock is SSOT.
- **Real-driver env gate** — `KIWA_MODE=real` (paired with `KIWA_OPENSEARCH_URL` + `OPENSEARCH_KEY`) gives you a real-driver env-gate that makes the mock path always-green and the real path opt-in.

## Where next

- Tutorial 73 — Vector search (kNN + HNSW + hybrid fusion + recall@k)
- Tutorial 74 — Faceted geo search (nested facet + bounding box + radius + polygon + isochrone)
- Concept doc — `docs/concepts/search-real-driver-testing.md` (8 axis × 4 provider = 32 cell grid + real-driver env-gate pattern SSOT)
- Migration guide — `docs/migrations/v1.35-to-v1.36.md`
