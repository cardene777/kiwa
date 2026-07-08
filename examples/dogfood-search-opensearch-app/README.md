# dogfood-search-opensearch-app v1.36-4

Dogfood application that exercises `@kiwa/search` v0.3 relevance +
synonym-advanced + index-management axes through a provider-neutral
17-op contract satisfied by both a deterministic mock adapter and a
`KIWA_MODE=real` OpenSearch OSS wire-surface real adapter.

## Purpose

Prove v0.3 relevance + synonym + index-management semantics track the
real OpenSearch OSS HTTP API closely enough that consumers can trust
the mock in unit tests. The fidelity harness diffs mock vs real traces
across 3 fixture sets (articles / multilingual / cluster), feeds the
divergence count into `@kiwa/quality-metrics` 13-axis release
gate, and covers BM25 + TF-IDF + custom ranking + A/B variant +
multi-language expansion + phonetic + stemmer + typo + rolling reindex
+ zero-downtime alias swap.

## Surface — 17 ops

`OpenSearchAdapter` — `OPENSEARCH_HARNESS_OPS`:

1. `startRelevanceSession` — start a relevance session (BM25 k1 / b tuning).
2. `seedRelevanceDocuments` — bulk seed relevance docs.
3. `scoreBm25` — BM25 scoring against a query.
4. `scoreTfIdf` — TF-IDF scoring against a query.
5. `applyCustomRanking` — boost the BM25 hits with a function score.
6. `selectAbVariant` — deterministic A/B variant selection.
7. `startSynonymSession` — start a synonym session.
8. `registerSynonyms` — register multi-language synonym entries.
9. `expandMultiLanguage` — expand a query across languages.
10. `matchPhonetic` — soundex-style phonetic match.
11. `normalizeStemmer` — stemmer normalization per language.
12. `bridgeTypo` — Levenshtein typo suggestion.
13. `startIndexMgmtSession` — start an index-mgmt session.
14. `allocateShards` — allocate primary + replica shards across nodes.
15. `promoteReplica` — promote a replica after a primary-node failure.
16. `advanceRollingReindex` — advance rolling reindex by a batch percent.
17. `swapZeroDowntime` — atomic alias swap once reindex is complete.
18. `emitFidelitySignal` — emit a synthesised fidelity marker.
19. `queryOpensearchHealth` — health check (real: HTTP GET; mock: ok).
20. `reset` — drop all state.

Plus the synthesised `resetVerified` step the fidelity harness emits at
the end of a lifecycle.

## Real driver env-gate

The real adapter reads `KIWA_MODE`, `KIWA_OPENSEARCH_URL`,
`OPENSEARCH_KEY`. When `KIWA_MODE=real` and both are wired, the
adapter walks the real path; otherwise every op emits the sentinel
`KIWA_SEARCH_ENV_MISSING`. Tests bypass the check with
`forceEnvPresent: true`.

Unlike Algolia (production HTTP API), OpenSearch OSS runs inside a
local testcontainers process, so `KIWA_OPENSEARCH_URL` typically
points at `http://127.0.0.1:9200` and `OPENSEARCH_KEY` at the admin
credential. In testcontainers mode the tests exercise the full 17-op
lifecycle end-to-end.

## Testing

```bash
pnpm test
```

The suite runs 5 test files (36 tests):

- `relevance-lifecycle.test.ts` — start / seed / bm25 / tfidf / custom
  ranking / A/B variant ops on the mock.
- `synonym-lifecycle.test.ts` — start / register / expand / phonetic /
  stemmer / typo ops on the mock.
- `index-mgmt-lifecycle.test.ts` — start / allocate / promote /
  rolling reindex / zero-downtime swap ops on the mock.
- `full-matrix-e2e.test.ts` — 3 fixture sets x relevance + synonym +
  index-mgmt lifecycles.
- `real-driver-env-gate.test.ts` — KIWA_MODE=real gate coverage.
- `emit-fidelity-report.test.ts` — fidelity report + release gate.
