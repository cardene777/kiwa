import { SearchEngine, createMeilisearchMock } from '@kiwa-lab/search';
import { describe, expect, it } from 'vitest';

describe('library documentation search recipes', () => {
  it('returns a document matching a query', async () => {
    const search = createMeilisearchMock();
    await search.addDocuments('docs', [{ id: '1', title: 'kiwa release gate' }]);

    const result = await search.search('docs', { q: 'kiwa' });
    expect(result.hits[0]?.document.id).toBe('1');
    expect(result.totalHits).toBe(1);
  });

  it('filters products before returning results', async () => {
    const search = new SearchEngine({ provider: 'meilisearch' });
    await search.addDocuments('products', [
      { id: '1', title: 'Keyboard', category: 'input' },
      { id: '2', title: 'Monitor', category: 'display' },
    ]);

    const result = await search.search('products', {
      q: 'keyboard',
      filter: { category: 'input' },
    });
    expect(result.hits.map((hit) => hit.document.id)).toEqual(['1']);
  });

  it('keeps existing document fields when a document is updated', async () => {
    const search = new SearchEngine({ provider: 'algolia' });
    await search.addDocuments('products', [{ id: 'p-1', title: 'Keyboard', stock: 0 }]);
    await search.updateDocuments('products', [
      { id: 'p-1', title: 'Wireless Keyboard', stock: 12 },
    ]);

    const result = await search.search('products', { q: 'wireless' });
    expect(result.hits[0]?.document).toMatchObject({
      id: 'p-1',
      title: 'Wireless Keyboard',
      stock: 12,
    });
  });

  it('removes a deleted document from the next search', async () => {
    const search = new SearchEngine({ provider: 'typesense' });
    await search.addDocuments('products', [{ id: 'p-2', title: 'Discontinued Camera' }]);

    await expect(search.deleteDocuments('products', ['p-2'])).resolves.toMatchObject({
      deleted: 1,
    });
    await expect(search.search('products', { q: 'camera' })).resolves.toMatchObject({ hits: [] });
  });
});
