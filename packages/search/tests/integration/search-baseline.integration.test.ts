import { describe, expect, it } from 'vitest';
import { SearchEngine } from '../../src/index.js';

/**
 * search integration domain test — real SearchEngine で addDocuments / search /
 * updateDocuments / deleteDocuments workflow を end-to-end で assert する。
 */
describe('search integration — SearchEngine workflow', () => {
  it('T-INT-D-001 addDocuments + search で hit 返却', async () => {
    const engine = new SearchEngine({ provider: 'meilisearch' });
    await engine.addDocuments('books', [
      { id: '1', title: 'kiwa handbook' },
      { id: '2', title: 'auth guide' },
    ]);
    const result = await engine.search('books', { q: 'kiwa' });
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.hits[0]!.document.id).toBe('1');
  });

  it('T-INT-D-002 updateDocuments で 既存 doc を更新', async () => {
    const engine = new SearchEngine({ provider: 'algolia' });
    await engine.addDocuments('books', [{ id: '10', title: 'original' }]);
    await engine.updateDocuments('books', [{ id: '10', title: 'updated', author: 'x' }]);
    const result = await engine.search('books', { q: 'updated' });
    expect(result.hits.length).toBe(1);
  });

  it('T-INT-D-003 deleteDocuments で index から除去', async () => {
    const engine = new SearchEngine({ provider: 'typesense' });
    await engine.addDocuments('books', [{ id: '20', title: 'deleteme' }]);
    const del = await engine.deleteDocuments('books', ['20']);
    expect(del.deleted).toBe(1);
    const result = await engine.search('books', { q: 'deleteme' });
    expect(result.hits.length).toBe(0);
  });

  it('T-INT-D-004 addDocuments idempotency (同 id 再追加)', async () => {
    const engine = new SearchEngine({ provider: 'meilisearch' });
    const r1 = await engine.addDocuments('books', [{ id: 'idem', title: 'first' }]);
    expect(r1.inserted).toBe(1);
    const r2 = await engine.addDocuments('books', [{ id: 'idem', title: 'first' }]);
    expect(r2.inserted).toBe(0);
  });

  it('T-INT-D-005 filter clause で query 絞込', async () => {
    const engine = new SearchEngine({
      provider: 'meilisearch',
      
      
    });
    await engine.addDocuments('books', [
      { id: 'f1', title: 'kiwa', author: 'a' },
      { id: 'f2', title: 'kiwa', author: 'b' },
    ]);
    const result = await engine.search('books', { q: 'kiwa', filter: { author: 'a' } });
    expect(result.hits.length).toBe(1);
    expect(result.hits[0]!.document.id).toBe('f1');
  });
});
