# Search mock (Meilisearch / Algolia / Typesense)

## What you'll build

A vitest test file that exercises **five search behaviours** — index CRUD, word-overlap ranking, filter narrowing, facet distribution, and typo tolerance — across the three providers `@kiwa-lab/search` covers.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-search && cd kiwa-search
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-lab/search
```

`package.json` + `tsconfig.json` — same shape as tutorial 12.

## Test — 3 providers, 1 spec

Create `tests/search.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  createMeilisearchMock,
  createAlgoliaMock,
  createTypesenseMock,
  type SearchAdapter,
} from '@kiwa-lab/search';

const providers: Array<[string, () => SearchAdapter]> = [
  ['meilisearch', () => createMeilisearchMock({ typoTolerance: false })],
  ['algolia', () => createAlgoliaMock({ typoTolerance: false })],
  ['typesense', () => createTypesenseMock({ typoTolerance: false })],
];

const seedBooks = [
  { id: '1', title: 'kiwa handbook', category: 'testing' },
  { id: '2', title: 'kiwa realtime', category: 'testing' },
  { id: '3', title: 'random other book', category: 'misc' },
];

describe.each(providers)('search — %s', (_, factory) => {
  it('add + search returns ranked hits', async () => {
    const search = factory();
    await search.addDocuments('books', seedBooks);
    const r = await search.search('books', { q: 'kiwa' });
    expect(r.totalHits).toBe(2);
    expect(r.hits[0]?.document.id).toBe('1'); // "kiwa" matches "kiwa" in title first
  });

  it('filter narrows by category', async () => {
    const search = factory();
    await search.addDocuments('books', seedBooks);
    const r = await search.search('books', { q: 'kiwa', filter: { category: 'testing' } });
    expect(r.hits).toHaveLength(2);
  });

  it('facet distribution counts hits per bucket', async () => {
    const search = factory();
    await search.addDocuments('books', seedBooks);
    const r = await search.search('books', { q: 'kiwa', facets: ['category'] });
    expect(r.facetDistribution.category?.testing).toBe(2);
  });

  it('sort descending by numeric field', async () => {
    const search = factory();
    await search.addDocuments('books', [
      { id: 'a', title: 'kiwa', year: 2020 },
      { id: 'b', title: 'kiwa', year: 2024 },
      { id: 'c', title: 'kiwa', year: 2018 },
    ]);
    const r = await search.search('books', { q: 'kiwa', sort: ['-year'] });
    expect(r.hits.map((h) => h.document.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('typo tolerance', () => {
  it('meilisearch (typoTolerance = true by default) matches near-typo', async () => {
    const search = createMeilisearchMock();
    await search.addDocuments('docs', [{ id: '1', title: 'realtime' }]);
    const r = await search.search('docs', { q: 'raltime' });
    expect(r.totalHits).toBe(1);
  });

  it('typesense (typoTolerance = false by default) rejects typo', async () => {
    const search = createTypesenseMock();
    await search.addDocuments('docs', [{ id: '1', title: 'realtime' }]);
    const r = await search.search('docs', { q: 'raltime' });
    expect(r.totalHits).toBe(0);
  });
});
```

Run:

```bash
pnpm test
```

You should see 14 passing tests.

## Provider defaults

| provider | typo default | rationale |
|---|---|---|
| Meilisearch | ON | matches Meili's out-of-the-box `typoTolerance.enabled = true` |
| Algolia | ON | matches Algolia's default `typoTolerance = true` |
| Typesense | OFF | matches the common production choice `num_typos = 0` |

Override with `createMeilisearchMock({ typoTolerance: false })` etc. when a test needs the opposite behaviour.

## Related

- [`@kiwa-lab/search` on npm](https://www.npmjs.com/package/@kiwa-lab/search)
- [Concept — search testing SSOT](../concepts/search-testing)
