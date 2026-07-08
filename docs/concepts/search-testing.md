# Search testing — kiwa SSOT

## Why search is hard to test against the real server

- **cold start** — a real Meili / Algolia / Typesense instance takes seconds to warm. Multiplied across a test matrix, that's minutes wasted per run.
- **network-shaped** — all three are HTTP-first. Every test call is a real fetch. Flaky when the CI network drops.
- **ranking non-determinism** — real servers may re-rank on typo distance, term frequency, position, custom rules. Assertions on `hits[0].id === expected` become brittle.

`@kiwa/search` moves the query path in-process with deterministic ranking so the same test can gate CI.

## The `SearchAdapter` contract

Five ops. All three providers implement the same shape.

- `addDocuments(index, docs)` — upsert (returns inserted count for net-new IDs)
- `updateDocuments(index, docs)` — partial merge (existing fields preserved)
- `deleteDocuments(index, ids)` — returns deleted count
- `search(index, { q, filter, facets, sort, limit, offset })`
- `clearIndex(index)`

Plus `getIndexStats(index) → { docCount }` for assertions.

## The ranking model

`SearchEngine` uses **word-overlap scoring** — the fraction of query tokens that match the document's string fields. Ties broken by insertion order (stable).

- Query tokens: lowercased, split on whitespace + punctuation.
- Match: exact token match in any string field of the document.
- Score: `matches / query.tokens.length`.
- Sort key: `{score desc, insertion_order asc}` unless `sort` overrides.

This is intentionally simpler than real BM25 / TF-IDF. Tests assert on relative order, not absolute score, so the SUT stays free to swap real ranking algorithms without breaking specs.

## Typo tolerance

1-edit-distance heuristic (single insertion / deletion / substitution). Provider defaults match production behaviour:

| provider | typo default | rationale |
|---|---|---|
| Meilisearch | ON | Meili's `typoTolerance.enabled = true` is the default |
| Algolia | ON | Algolia's `typoTolerance` is `true` |
| Typesense | OFF | Typesense's `num_typos = 0` is the common production choice |

Override per test: `createMeilisearchMock({ typoTolerance: false })`.

## Filter / facet / sort semantics

- **`filter`** — plain object of exact-match key/value pairs. No `>` / `<` / `IN` — real providers use provider-specific filter DSLs, which the mock does NOT parse. If your SUT uses the DSL directly, test that path against the real server.
- **`facets`** — array of field names to bucket. Returned as `facetDistribution: Record<field, Record<value, count>>`.
- **`sort`** — array of field names, prefix `-` for descending. Multiple fields sorted in order.

## When NOT to use the mock

- Testing the actual DSL (`> < IN facetFilters`) — mock does not parse DSL. Use the real provider.
- Testing async index build performance — mock is synchronous.
- Testing multi-index cross-search — mock is single-index-per-call.

## Related

- [Tutorial 13 — Search mock](../tutorials/13-search)
- [`@kiwa/search` on npm](https://www.npmjs.com/package/@kiwa/search)
