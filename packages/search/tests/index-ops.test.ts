import { describe, expect, it } from 'vitest';
import { createMeilisearchMock, createAlgoliaMock, createTypesenseMock } from '../src/index.js';

const providers = [
  ['meilisearch', createMeilisearchMock],
  ['algolia', createAlgoliaMock],
  ['typesense', createTypesenseMock],
] as const;

describe.each(providers)('addDocuments / updateDocuments / deleteDocuments — %s', (_name, factory) => {
  it('adds new docs and reports inserted count', async () => {
    const search = factory();
    const result = await search.addDocuments('books', [
      { id: '1', title: 'kiwa handbook' },
      { id: '2', title: 'testing strategies' },
    ]);
    expect(result.inserted).toBe(2);
    expect(search.getIndexStats('books').docCount).toBe(2);
  });

  it('addDocuments is upsert — re-adding same id does not double count', async () => {
    const search = factory();
    await search.addDocuments('books', [{ id: '1', title: 'a' }]);
    const second = await search.addDocuments('books', [{ id: '1', title: 'b' }]);
    expect(second.inserted).toBe(0);
    expect(search.getIndexStats('books').docCount).toBe(1);
  });

  it('updateDocuments merges partial fields', async () => {
    const search = factory();
    await search.addDocuments('books', [{ id: '1', title: 'original', author: 'ann' }]);
    await search.updateDocuments('books', [{ id: '1', title: 'updated' }]);
    const r = await search.search('books', { q: 'updated' });
    expect(r.hits[0]?.document.author).toBe('ann');
    expect(r.hits[0]?.document.title).toBe('updated');
  });

  it('deleteDocuments reports deleted count', async () => {
    const search = factory();
    await search.addDocuments('books', [
      { id: '1', title: 'a' },
      { id: '2', title: 'b' },
    ]);
    const r = await search.deleteDocuments('books', ['1', '99']);
    expect(r.deleted).toBe(1);
    expect(search.getIndexStats('books').docCount).toBe(1);
  });

  it('clearIndex resets index to empty', async () => {
    const search = factory();
    await search.addDocuments('books', [{ id: '1', title: 'a' }]);
    await search.clearIndex('books');
    expect(search.getIndexStats('books').docCount).toBe(0);
  });
});
