import { describe, expect, it } from 'vitest';
import {
  setupNextRscEnv,
  RSC_ERROR_BOUNDARY_SYMBOL,
  type RscStreamSource,
} from '../src/setup-next-rsc-env.js';
import type { RscNode, RscElement } from '../src/render-server-component.js';

function h(
  type: string,
  props: Record<string, unknown> = {},
  ...children: RscNode[]
): RscElement {
  return {
    type,
    key: null,
    props: { ...props, children: children.length === 1 ? children[0] : children },
  };
}

describe('setupNextRscEnv', () => {
  it('T-SNE-001 single-chunk component: resolved tree captured, no fallback, no error', async () => {
    const Page = async (props: Record<string, unknown>) =>
      h('main', {}, h('h1', {}, `Hello ${props.name as string}`));
    const env = await setupNextRscEnv({ component: Page, props: { name: 'kiwa' } });
    expect(env.errorBoundary).toBeNull();
    expect(env.timedOut).toBe(false);
    expect(env.fallback).toBeNull();
    expect(env.chunks).toHaveLength(1);
    expect(env.resolved).not.toBeNull();
  });

  it('T-SNE-002 streaming source: chunks arrive in source order', async () => {
    async function* source(): AsyncGenerator<RscNode, void, unknown> {
      yield h('div', {}, 'chunk-1');
      yield h('div', {}, 'chunk-2');
      yield h('div', {}, 'chunk-3');
    }
    const env = await setupNextRscEnv({ dataSource: source() });
    expect(env.chunks).toHaveLength(3);
    expect(env.resolved).toEqual(h('div', {}, 'chunk-3'));
    expect(env.errorBoundary).toBeNull();
  });

  it('T-SNE-003 Suspense fallback prepended as chunk 0 and exposed via env.fallback', async () => {
    const fallback = h('div', { 'data-testid': 'spinner' }, 'loading...');
    async function* source(): AsyncGenerator<RscNode, void, unknown> {
      yield h('ul', {}, h('li', {}, 'a'));
    }
    const env = await setupNextRscEnv({ dataSource: source(), suspenseFallback: fallback });
    expect(env.fallback).toBe(fallback);
    expect(env.chunks).toHaveLength(2);
    expect(env.chunks[0]).toBe(fallback);
    expect(env.resolved).toEqual(h('ul', {}, h('li', {}, 'a')));
  });

  it('T-SNE-004 fallback shown forever: source yields no chunks → resolved stays null', async () => {
    const fallback = h('div', {}, 'still loading');
    async function* source(): AsyncGenerator<RscNode, void, unknown> {
      // never yields a chunk before completing — Suspense never resolves
    }
    const env = await setupNextRscEnv({ dataSource: source(), suspenseFallback: fallback });
    expect(env.chunks).toEqual([fallback]);
    expect(env.fallback).toBe(fallback);
    expect(env.resolved).toBeNull();
    expect(env.errorBoundary).toBeNull();
  });

  it('T-SNE-005 component throws → error boundary captures it, resolved is null', async () => {
    const Page = async () => {
      throw new Error('db down');
    };
    const env = await setupNextRscEnv({ component: Page });
    expect(env.errorBoundary).not.toBeNull();
    expect(env.errorBoundary?.[RSC_ERROR_BOUNDARY_SYMBOL]).toBe(true);
    expect((env.errorBoundary?.error as Error).message).toBe('db down');
    expect(env.resolved).toBeNull();
  });

  it('T-SNE-006 injectError short-circuits — no component is invoked', async () => {
    let invoked = false;
    const Page = async () => {
      invoked = true;
      return h('div', {}, 'should not render');
    };
    const env = await setupNextRscEnv({
      component: Page,
      injectError: new Error('forced boundary'),
    });
    expect(invoked).toBe(false);
    expect(env.errorBoundary).not.toBeNull();
    expect((env.errorBoundary?.error as Error).message).toBe('forced boundary');
    expect(env.resolved).toBeNull();
  });

  it('T-SNE-007 stream throws mid-flight → earlier chunks preserved + errorBoundary set', async () => {
    async function* source(): AsyncGenerator<RscNode, void, unknown> {
      yield h('div', {}, 'first');
      yield h('div', {}, 'second');
      throw new Error('stream broken');
    }
    const env = await setupNextRscEnv({ dataSource: source() });
    expect(env.chunks).toHaveLength(2);
    expect(env.errorBoundary).not.toBeNull();
    expect((env.errorBoundary?.error as Error).message).toBe('stream broken');
    expect(env.resolved).toBeNull();
  });

  it('T-SNE-008 streamingTimeout bounds wall clock — slow source returns timedOut=true', async () => {
    async function* source(): AsyncGenerator<RscNode, void, unknown> {
      await new Promise((resolve) => setTimeout(resolve, 100));
      yield h('div', {}, 'late chunk');
    }
    const env = await setupNextRscEnv({ dataSource: source(), streamingTimeout: 10 });
    expect(env.timedOut).toBe(true);
    expect(env.resolved).toBeNull();
    expect(env.errorBoundary).toBeNull();
  });

  it('T-SNE-009 fallback + injectError → fallback preserved in chunks, error captured', async () => {
    const fallback = h('div', {}, 'loading');
    const env = await setupNextRscEnv({
      suspenseFallback: fallback,
      injectError: { kind: 'boundary', cause: 'auth' },
    });
    expect(env.chunks).toEqual([fallback]);
    expect(env.fallback).toBe(fallback);
    expect(env.errorBoundary).not.toBeNull();
    expect(env.errorBoundary?.error).toEqual({ kind: 'boundary', cause: 'auth' });
  });

  it('T-SNE-010 no component + no dataSource + no injectError → empty env', async () => {
    const env = await setupNextRscEnv({});
    expect(env.chunks).toEqual([]);
    expect(env.fallback).toBeNull();
    expect(env.resolved).toBeNull();
    expect(env.errorBoundary).toBeNull();
    expect(env.timedOut).toBe(false);
  });

  it('T-SNE-011 sync component is also supported', async () => {
    const Sync = (props: Record<string, unknown>) => h('span', {}, props.msg as string);
    const env = await setupNextRscEnv({ component: Sync, props: { msg: 'sync' } });
    expect(env.resolved).toEqual(h('span', {}, 'sync'));
  });

  it('T-SNE-012 default options: timeout defaults to 5000ms (fast stream succeeds)', async () => {
    async function* source(): AsyncGenerator<RscNode, void, unknown> {
      yield h('div', {}, 'fast');
    }
    const env = await setupNextRscEnv({ dataSource: source() });
    expect(env.timedOut).toBe(false);
    expect(env.resolved).toEqual(h('div', {}, 'fast'));
  });

  it('T-SNE-013 dataSource takes precedence over component', async () => {
    let invoked = false;
    const Page = async () => {
      invoked = true;
      return h('div', {}, 'from-component');
    };
    async function* source(): AsyncGenerator<RscNode, void, unknown> {
      yield h('div', {}, 'from-stream');
    }
    const env = await setupNextRscEnv({ component: Page, dataSource: source() });
    expect(invoked).toBe(false);
    expect(env.resolved).toEqual(h('div', {}, 'from-stream'));
  });

  it('T-SNE-014 multi-chunk stream with fallback: chunks[0]=fallback, last=resolved', async () => {
    const fallback = h('div', {}, 'spinner');
    async function* source(): AsyncGenerator<RscNode, void, unknown> {
      yield h('div', {}, 'partial-1');
      yield h('div', {}, 'partial-2');
      yield h('div', {}, 'final');
    }
    const env = await setupNextRscEnv({ dataSource: source(), suspenseFallback: fallback });
    expect(env.chunks).toHaveLength(4);
    expect(env.chunks[0]).toBe(fallback);
    expect(env.chunks[3]).toEqual(h('div', {}, 'final'));
    expect(env.resolved).toEqual(h('div', {}, 'final'));
  });

  it('T-SNE-015 streamingTimeout: 0 ms always times out (no chunks)', async () => {
    async function* source(): AsyncGenerator<RscNode, void, unknown> {
      yield h('div', {}, 'instant');
    }
    const env = await setupNextRscEnv({ dataSource: source(), streamingTimeout: 0 });
    expect(env.timedOut).toBe(true);
  });
});
