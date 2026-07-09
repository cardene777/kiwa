// kiwa unit test for app/items/_kiwa/items-rsc.ts
// — renders the async RSC through @kiwa-lab/nextjs's renderServerComponent.

import { describe, expect, it } from 'vitest';
import { renderServerComponent, findAll, textContent } from '@kiwa-lab/nextjs';
import { ItemsPageRSC } from '../app/items/_kiwa/items-rsc.js';

describe('ItemsPageRSC via @kiwa-lab/nextjs renderServerComponent', () => {
  it('T-NF-201: session=admin で h1 + ul/li が 3 件 render', async () => {
    const { tree, error } = await renderServerComponent({
      component: ItemsPageRSC,
      props: { sessionGetter: () => 'session=admin' },
    });
    expect(error).toBeUndefined();
    const headings = findAll(tree, (node) => node.type === 'h1');
    expect(headings.length).toBe(1);
    expect(textContent(headings[0]!)).toContain('kiwa Next.js PoC');
    const items = findAll(tree, (node) => node.type === 'li');
    expect(items.length).toBe(3);
    expect(textContent(tree)).toContain('signed in as: u1 (3 items)');
  });

  it('T-NF-202: session 不在で Sign in required message を表示', async () => {
    const { tree } = await renderServerComponent({
      component: ItemsPageRSC,
      props: { sessionGetter: () => null },
    });
    const headings = findAll(tree, (node) => node.type === 'h1');
    expect(textContent(headings[0]!)).toContain('Sign in required');
  });

  it('T-NF-203: session=banned で Forbidden message + data-testid=banned', async () => {
    const { tree } = await renderServerComponent({
      component: ItemsPageRSC,
      props: { sessionGetter: () => 'session=banned' },
    });
    const banned = findAll(tree, (node) => node.props['data-testid'] === 'banned');
    expect(banned.length).toBe(1);
    expect(textContent(tree)).toContain('Forbidden');
  });

  it('T-NF-204: searchParams.tag=framework で 2 件に絞る', async () => {
    const { tree } = await renderServerComponent({
      component: ItemsPageRSC,
      props: {
        sessionGetter: () => 'session=admin',
        searchParams: { tag: 'framework' },
      },
    });
    const items = findAll(tree, (node) => node.type === 'li');
    expect(items.length).toBe(2);
    expect(textContent(tree)).toContain('2 items');
  });

  it('T-NF-205: 全 items に react tag が 2 件 hit', async () => {
    const { tree } = await renderServerComponent({
      component: ItemsPageRSC,
      props: {
        sessionGetter: () => 'session=admin',
        searchParams: { tag: 'react' },
      },
    });
    const items = findAll(tree, (node) => node.type === 'li');
    expect(items.length).toBe(2);
  });
});
