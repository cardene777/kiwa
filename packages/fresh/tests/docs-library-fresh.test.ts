import { expect, test } from 'vitest';
import {
  defineHead,
  defineIsland,
  h,
  hydrateIslands,
  invokeFreshHandler,
  islandPlaceholder,
  mergeHead,
  renderHead,
  simulateInteraction,
} from '../src/index.js';
import type { FreshHandlers, FreshPageProps } from '../src/index.js';

test('the quickstart renders page data and separates an unsupported method', async () => {
  const route: {
    handlers: FreshHandlers<{ name: string }>;
    page: (props: FreshPageProps<{ name: string }>) => ReturnType<typeof h>;
  } = {
    handlers: { GET: (_req, ctx) => ctx.render({ name: 'Ada' }) },
    page: ({ data, params }) => h('h1', null, `${params.id} ${data?.name}`),
  };
  const result = await invokeFreshHandler({
    ...route,
    req: new Request('http://localhost/profile/42'),
    params: { id: '42' },
  });
  expect(result.renderData).toEqual({ name: 'Ada' });
  await expect(result.response.text()).resolves.toBe('<h1>42 Ada</h1>');

  const unsupported = await invokeFreshHandler({
    ...route,
    req: new Request('http://localhost/profile/42', { method: 'POST' }),
  });
  expect(unsupported.response.status).toBe(405);
  expect(unsupported.response.headers.get('allow')).toBe('GET');
});

test('the how-to joins an island contract and route head override', () => {
  let clicks = 0;
  const Counter = defineIsland({
    name: 'Counter',
    component: (props: { start: number }) => h('button', { onClick: () => { clicks += 1; } }, String(props.start)),
  });
  const result = hydrateIslands({
    ssrTree: h('main', null, islandPlaceholder(Counter, { start: 7 })),
    islands: [Counter],
  });
  expect(result).toMatchObject({ missing: [], unregistered: [] });
  expect(result.html).toContain('<button onClick=');
  expect(result.html).toContain('>7</button>');
  expect(simulateInteraction({ mount: result.hydrated[0]!.mount, event: 'click' }).invoked).toBe(1);
  expect(clicks).toBe(1);

  const html = renderHead(mergeHead([
    defineHead({ title: 'Store', meta: [{ name: 'description', content: 'layout description' }] }),
    defineHead({ meta: [{ name: 'description', content: 'product description' }] }),
  ]));
  expect(html).toContain('content="product description"');
  expect(html).not.toContain('content="layout description"');
});
