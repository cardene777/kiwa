/**
 * v1.19-5 docs 補強 (Issue #811) — tutorial 28 code snippet 検証。
 *
 * `docs/tutorials/28-solidjs-signal-app.md` に載っている
 * code snippet が実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。
 */
import { describe, expect, it } from 'vitest';
import {
  mockSignal,
  mockEffect,
  batch,
  createResourceStub,
  isSignal,
  isResourceAccessor,
} from '../src/signal.js';
import { renderWithSuspense } from '../src/route.js';
import { h, stringify } from '../src/render.js';

describe('tutorial 28 — signal + effect contract snippet', () => {
  it('effect body re-runs when a subscribed signal writes (tutorial: 1st snippet)', () => {
    const [count, setCount] = mockSignal(0);
    let seen = -1;
    mockEffect(() => {
      seen = count();
    });
    setCount(3);
    expect(seen).toBe(3);
    expect(isSignal(count)).toBe(true);
  });

  it('batch dedups two writes into a single effect re-run (tutorial: 2nd snippet)', () => {
    const [a, setA] = mockSignal('a1');
    const [b, setB] = mockSignal('b1');
    let runs = 0;
    mockEffect(() => {
      void a();
      void b();
      runs += 1;
    });
    const baseline = runs;
    batch(() => {
      setA('a2');
      setB('b2');
    });
    expect(runs).toBe(baseline + 1);
  });
});

describe('tutorial 28 — createResourceStub Suspense-shaped fetch snippet', () => {
  it('initial fetch transitions pending → ready and exposes the value', async () => {
    const { accessor, initialFetch } = createResourceStub(async () => ({ user: 'kiwa' }));
    expect(accessor.state).toBe('pending');
    expect(accessor.loading).toBe(true);
    await initialFetch;
    expect(accessor.state).toBe('ready');
    expect(accessor.loading).toBe(false);
    expect(accessor()).toEqual({ user: 'kiwa' });
    expect(isResourceAccessor(accessor)).toBe(true);
  });

  it('refetch flips state to refreshing then back to ready', async () => {
    let call = 0;
    const { accessor, actions, initialFetch } = createResourceStub(async () => {
      call += 1;
      return call;
    });
    await initialFetch;
    const p = actions.refetch();
    expect(accessor.state).toBe('refreshing');
    const next = await p;
    expect(next).toBe(2);
    expect(accessor.state).toBe('ready');
    expect(accessor()).toBe(2);
  });
});

describe('tutorial 28 — EffectHandle trace snippet', () => {
  it('handle.trace() records readValues in order across writes', () => {
    const [get, set] = mockSignal(1);
    const handle = mockEffect(() => {
      void get();
    });
    set(2);
    set(3);
    const trace = handle.trace();
    expect(trace.map((e) => e.readValues[0])).toEqual([1, 2, 3]);
  });
});

describe('tutorial 28 — renderWithSuspense snippet', () => {
  it('boundary exposes fallback + resolved trees separately (walks pending → ready)', async () => {
    const boundary = await renderWithSuspense({
      component: () => h('p', null, 'ready'),
      fallback: () => h('p', null, 'loading'),
      waitFor: Promise.resolve('ok'),
    });
    expect(stringify(boundary.fallback)).toBe('<p>loading</p>');
    expect(boundary.resolved && stringify(boundary.resolved)).toBe('<p>ready</p>');
    expect(boundary.timedOut).toBe(false);
  });
});
