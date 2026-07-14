import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { SearchEngine } from '../../src/index.js';

/**
 * search skill domain test — search lib の主要 skill flow (addDocuments /
 * search / update / delete) を spy 経路で assert する。
 */
describe('search skill — SearchEngine skill flow', () => {
  it('T-SKL-D-001 addDocuments + search skill flow が順序で発火', async () => {
    const spy = createToolSpy();
    const engine = new SearchEngine({ provider: 'meilisearch' });
    await engine.addDocuments('idx', [{ id: 's1', title: 'kiwa' }]);
    spy.record('search.addDocuments', JSON.stringify({ index: 'idx' }));
    const result = await engine.search('idx', { q: 'kiwa' });
    spy.record('search.search', JSON.stringify({ q: 'kiwa' }));

    assertToolCallOrder(spy, ['search.addDocuments', 'search.search']);
    expect(result.hits.length).toBeGreaterThan(0);
  });

  it('T-SKL-D-002 update skill flow (add + update + re-search)', async () => {
    const spy = createToolSpy();
    const engine = new SearchEngine({ provider: 'algolia' });
    await engine.addDocuments('idx', [{ id: 's2', title: 'old' }]);
    spy.record('search.addDocuments', '{}');
    await engine.updateDocuments('idx', [{ id: 's2', title: 'new-title' }]);
    spy.record('search.updateDocuments', '{}');
    const result = await engine.search('idx', { q: 'new-title' });
    spy.record('search.search', '{}');

    assertToolCallOrder(spy, ['search.addDocuments', 'search.updateDocuments', 'search.search']);
    expect(result.hits.length).toBe(1);
  });

  it('T-SKL-D-003 batch addDocuments skill (times=3)', async () => {
    const spy = createToolSpy();
    const engine = new SearchEngine({ provider: 'meilisearch' });
    await engine.addDocuments('idx', [{ id: 'b1', title: 'a' }]);
    spy.record('search.addDocuments', '{}');
    await engine.addDocuments('idx', [{ id: 'b2', title: 'b' }]);
    spy.record('search.addDocuments', '{}');
    await engine.addDocuments('idx', [{ id: 'b3', title: 'c' }]);
    spy.record('search.addDocuments', '{}');

    assertToolCalled(spy, 'search.addDocuments', { times: 3 });
  });

  it('T-SKL-D-004 delete skill flow (add + delete + re-search)', async () => {
    const spy = createToolSpy();
    const engine = new SearchEngine({ provider: 'typesense' });
    await engine.addDocuments('idx', [{ id: 'del1', title: 'toremove' }]);
    spy.record('search.addDocuments', '{}');
    await engine.deleteDocuments('idx', ['del1']);
    spy.record('search.deleteDocuments', JSON.stringify({ ids: ['del1'] }));
    const result = await engine.search('idx', { q: 'toremove' });
    spy.record('search.search', '{}');

    assertToolCallOrder(spy, ['search.addDocuments', 'search.deleteDocuments', 'search.search']);
    expect(result.hits.length).toBe(0);
  });

  it('T-SKL-D-005 filter skill flow (add + filter search)', async () => {
    const spy = createToolSpy();
    const engine = new SearchEngine({
      provider: 'meilisearch',
      
      
    });
    await engine.addDocuments('idx', [
      { id: 'f1', title: 'kiwa', tag: 'a' },
      { id: 'f2', title: 'kiwa', tag: 'b' },
    ]);
    spy.record('search.addDocuments', '{}');
    const result = await engine.search('idx', { q: 'kiwa', filter: { tag: 'a' } });
    spy.record('search.search', JSON.stringify({ filter: { tag: 'a' } }));

    assertToolCallOrder(spy, ['search.addDocuments', 'search.search']);
    expect(result.hits.length).toBe(1);
  });
});
