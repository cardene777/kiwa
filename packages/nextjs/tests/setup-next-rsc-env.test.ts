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

  it('T-SNE-016 streamingTimeout: 0 ms with a component times out synchronously too', async () => {
    // Existing T-SNE-015 exercises the dataSource arm of `opts.dataSource || opts.component`;
    // this pins the component arm so the fast-timeout branch runs on both inputs.
    const Page = async () => h('div', {}, 'instant');
    const env = await setupNextRscEnv({ component: Page, streamingTimeout: 0 });
    expect(env.timedOut).toBe(true);
    expect(env.chunks).toEqual([]);
  });

  it('T-SNE-017 streamingTimeout: 0 ms with a fallback puts the fallback into chunks[0]', async () => {
    // Closes the `fallback !== null ? [fallback] : []` truthy arm on the fast-timeout return
    // (line 100). Existing tests pass no fallback so only the [] arm ran.
    const fallback = h('div', {}, 'spinner');
    async function* source(): AsyncGenerator<RscNode, void, unknown> {
      yield h('div', {}, 'instant');
    }
    const env = await setupNextRscEnv({
      dataSource: source(),
      streamingTimeout: 0,
      suspenseFallback: fallback,
    });
    expect(env.timedOut).toBe(true);
    expect(env.chunks).toEqual([fallback]);
    expect(env.fallback).toBe(fallback);
  });

  it('T-SNE-018 empty opts with a fallback still populates chunks[0] with the fallback', async () => {
    // Closes the `fallback !== null ? [fallback] : []` truthy arm on the empty-env return
    // (line 121). Existing T-SNE-010 passes no fallback so only the [] arm ran.
    const fallback = h('div', {}, 'empty-placeholder');
    const env = await setupNextRscEnv({ suspenseFallback: fallback });
    expect(env.chunks).toEqual([fallback]);
    expect(env.fallback).toBe(fallback);
    expect(env.resolved).toBeNull();
    expect(env.timedOut).toBe(false);
  });

  it('T-SNE-019 slow stream with a fallback times out and carries the fallback back', async () => {
    // Closes the `fallback !== null ? [fallback] : []` truthy arm on the runtime-timeout return
    // (line 134). Existing T-SNE-006 timed out without a fallback, so only the [] arm ran there.
    const fallback = h('div', {}, 'timeout-placeholder');
    async function* source(): AsyncGenerator<RscNode, void, unknown> {
      // Never resolves within the 10ms timeout.
      await new Promise((resolve) => setTimeout(resolve, 100));
      yield h('div', {}, 'never');
    }
    const env = await setupNextRscEnv({
      dataSource: source(),
      streamingTimeout: 10,
      suspenseFallback: fallback,
    });
    expect(env.timedOut).toBe(true);
    expect(env.chunks).toEqual([fallback]);
  });

  it('T-SNE-020 a stream whose final chunk is undefined makes resolved fall back to null', async () => {
    // Closes the `chunks[chunks.length - 1] ?? null` fallback on line 60 by yielding a nullish
    // value as the last chunk. Existing tests all yield defined RscNodes so the `?? null` never
    // ran. Yielding null wouldn't reach the fallback because null is already a valid RscNode,
    // so the check needs `undefined`, which the `??` treats as nullish.
    async function* source(): AsyncGenerator<RscNode | undefined, void, unknown> {
      yield h('div', {}, 'first');
      // biome-ignore lint/suspicious/noExplicitAny: exercising the runtime `??` fallback
      yield undefined as any;
    }
    // biome-ignore lint/suspicious/noExplicitAny: dataSource accepts any AsyncGenerator here
    const env = await setupNextRscEnv({ dataSource: source() as any });
    expect(env.chunks).toHaveLength(2);
    expect(env.resolved).toBeNull();
  });
});
