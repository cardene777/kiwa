# @kiwa-lab/search

Unified in-memory search mock for the 3 major search providers — Meilisearch, Algolia, Typesense.

- 5-op adapter (addDocuments / updateDocuments / deleteDocuments / search / clearIndex)
- Deterministic word-overlap ranking (offset / limit / filter / facet / sort)
- 1-edit-distance typo tolerance (per-provider default: Meili ON / Algolia ON / Typesense OFF)

```ts
import { createMeilisearchMock } from '@kiwa-lab/search';

const search = createMeilisearchMock();
await search.addDocuments('docs', [{ id: '1', title: 'kiwa release gate' }]);
const r = await search.search('docs', { q: 'kiwa' });
```
