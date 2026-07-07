# dogfood-search-faceted-geo-app v1.36-3

Dogfood application that exercises `@kiwa-test/search` v0.3
faceted-advanced + geo axes through a provider-neutral 15-op contract
satisfied by both a deterministic mock adapter and a `KIWA_MODE=real`
Algolia wire-surface real adapter.

## Purpose

Prove v0.3 faceted-advanced + geo semantics track the real Algolia HTTP
API closely enough that consumers can trust the mock in unit tests. The
fidelity harness diffs mock vs real traces across 3 fixture sets
(categories / restaurants / events) x 4 facet queries (nested /
hierarchy / distinct / refined) x 3 geo queries (bounding-box / radius /
polygon) and feeds the divergence count into `@kiwa-test/quality-metrics`
13-axis release gate.

## Surface — 15 ops

`FacetedGeoSearchAdapter` — `FACETED_GEO_HARNESS_OPS`:

1. `startFacetedSession` — start a facet session (target / indexId).
2. `seedFacetedDocuments` — bulk seed docs to the facet session.
3. `computeNestedFacets` — build the outer x inner facet tree.
4. `traverseHierarchy` — walk a `A > B > C` hierarchical facet.
5. `countDistinct` — distinct value count over one facet field.
6. `applyRefinedFilter` — retain docs where `field = value`.
7. `startGeoSession` — start a geo session.
8. `seedGeoDocuments` — bulk seed docs to the geo session.
9. `queryBoundingBox` — filter docs inside a bbox.
10. `queryRadius` — filter docs inside a radius from a center.
11. `queryPolygon` — filter docs inside a polygon.
12. `emitFidelitySignal` — emit a synthesised fidelity marker.
13. `queryAlgoliaHealth` — health check (real: HTTP GET; mock: ok).
14. `reset` — drop all state.

Plus the synthesised `resetVerified` step the fidelity harness emits at
the end of a lifecycle.

## Real driver env-gate

The real adapter reads `KIWA_MODE`, `KIWA_ALGOLIA_URL`, `ALGOLIA_KEY`.
When `KIWA_MODE=real` and both are wired, the adapter walks the real
path; otherwise every op emits the sentinel `KIWA_SEARCH_ENV_MISSING`.
Tests bypass the check with `forceEnvPresent: true`.

The Algolia sandbox is a real production HTTP API (not a testcontainers
image like Meilisearch / Typesense), so `KIWA_ALGOLIA_URL` should point
at the sandbox application URL
(`https://<APP_ID>-dsn.algolia.net`) and `ALGOLIA_KEY` at the admin API
key. In sandbox mode the tests exercise `emitFidelitySignal` +
`queryAlgoliaHealth` only, to avoid mutating the sandbox index.

## Testing

```bash
pnpm test
```

The suite runs 5 test files (44 tests):

- `faceted-lifecycle.test.ts` — start / seed / nested / hierarchy /
  distinct / refined ops on the mock.
- `geo-lifecycle.test.ts` — start / seed / bbox / radius / polygon ops
  on the mock.
- `full-matrix-e2e.test.ts` — 3 fixture sets x facet + geo lifecycles.
- `real-driver-env-gate.test.ts` — KIWA_MODE=real gate coverage.
- `emit-fidelity-report.test.ts` — fidelity report + release gate.
