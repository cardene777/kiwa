import { describe, expect, it } from 'vitest';
import {
  invokeSolidRoute,
  renderWithSuspense,
  errorBoundary,
  redirect,
  notFound,
  isSuspenseBoundary,
  isErrorBoundary,
} from '../src/route.js';
import { h, stringify, isSolidElement } from '../src/render.js';

describe('invokeSolidRoute', () => {
  it('T-SJ-033 renders page with loader data + params + query', async () => {
    const load = async ({ params, query }: { params: Record<string, string | undefined>; query: Record<string, string | undefined> }) => ({
      id: params.id,
      q: query.q,
    });
    const Page = (props: { params: Record<string, string | undefined>; query: Record<string, string | undefined>; data: { id: string | undefined; q: string | undefined } | undefined }) =>
      h('article', null, `${props.data?.id}-${props.data?.q}`);
    const { tree, data, error, redirect: r, notFound: nf } = await invokeSolidRoute({
      page: Page,
      load,
      params: { id: '42' },
      query: { q: 'kiwa' },
    });
    expect(error).toBeUndefined();
    expect(r).toBeNull();
    expect(nf).toBeNull();
    expect(data).toEqual({ id: '42', q: 'kiwa' });
    expect(tree && isSolidElement(tree) && stringify(tree)).toBe('<article>42-kiwa</article>');
  });

  it('T-SJ-034 loader throw of redirect() lands in result.redirect', async () => {
    const { redirect: r, error, tree } = await invokeSolidRoute({
      page: () => h('p', null, 'unreachable'),
      load: async () => {
        throw redirect('/login', 302);
      },
    });
    expect(error).toBeUndefined();
    expect(r?.url).toBe('/login');
    expect(r?.status).toBe(302);
    expect(tree).toBeNull();
  });

  it('T-SJ-035 loader throw of notFound() lands in result.notFound', async () => {
    const { notFound: nf, error, tree } = await invokeSolidRoute({
      page: () => h('p', null, 'unreachable'),
      load: async () => {
        throw notFound();
      },
    });
    expect(error).toBeUndefined();
    expect(nf).toBeTruthy();
    expect(tree).toBeNull();
  });

  it('T-SJ-036 page body throw (non-signal) surfaces as error', async () => {
    const { error, tree } = await invokeSolidRoute({
      page: () => {
        throw new Error('boom');
      },
    });
    expect((error as Error).message).toBe('boom');
    expect(tree).toBeNull();
  });

  it('T-SJ-037 defaults empty params + query when omitted', async () => {
    const Page = (props: { params: Record<string, string | undefined>; query: Record<string, string | undefined> }) =>
      h('span', null, `p=${Object.keys(props.params).length}/q=${Object.keys(props.query).length}`);
    const { tree } = await invokeSolidRoute({ page: Page });
    expect(tree && stringify(tree)).toBe('<span>p=0/q=0</span>');
  });
});

describe('renderWithSuspense', () => {
  it('T-SJ-038 exposes fallback first then swaps to resolved component tree', async () => {
    const boundary = await renderWithSuspense({
      component: () => h('p', null, 'ready'),
      fallback: h('p', null, 'loading'),
      waitFor: Promise.resolve('ok'),
    });
    expect(isSuspenseBoundary(boundary)).toBe(true);
    expect(stringify(boundary.fallback)).toBe('<p>loading</p>');
    expect(boundary.resolved && stringify(boundary.resolved)).toBe('<p>ready</p>');
    expect(boundary.timedOut).toBe(false);
  });

  it('T-SJ-039 accepts a fallback component (function form)', async () => {
    const boundary = await renderWithSuspense({
      component: () => h('p', null, 'done'),
      fallback: () => h('em', null, 'wait...'),
      waitFor: Promise.resolve(1),
    });
    expect(stringify(boundary.fallback)).toBe('<em>wait...</em>');
  });

  it('T-SJ-040 timedOut=true when waitFor exceeds the timeoutMs', async () => {
    const never = new Promise<never>(() => {
      /* intentionally hang */
    });
    const boundary = await renderWithSuspense({
      component: () => h('p', null, 'never'),
      fallback: h('p', null, 'wait'),
      waitFor: never,
      timeoutMs: 25,
    });
    expect(boundary.timedOut).toBe(true);
    expect(boundary.resolved).toBeNull();
  });
});

describe('errorBoundary', () => {
  it('T-SJ-041 renders the component tree when it does not throw', () => {
    const tree = errorBoundary({
      component: () => h('p', null, 'ok'),
      fallback: (err) => h('span', null, `err=${(err as Error).message}`),
    });
    expect(isErrorBoundary(tree)).toBe(false);
    if (isErrorBoundary(tree)) throw new Error('unreachable');
    expect(isSolidElement(tree)).toBe(true);
    expect(stringify(tree)).toBe('<p>ok</p>');
  });

  it('T-SJ-042 captures a throw and materializes the fallback', () => {
    const result = errorBoundary({
      component: () => {
        throw new Error('kaboom');
      },
      fallback: (err) => h('span', null, (err as Error).message),
    });
    expect(isErrorBoundary(result)).toBe(true);
    if (!isErrorBoundary(result)) throw new Error('unreachable');
    expect((result.caught as Error).message).toBe('kaboom');
    expect(stringify(result.fallback)).toBe('<span>kaboom</span>');
  });
});
