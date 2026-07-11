import { describe, expect, it } from 'vitest';
import {
  evictExpired,
  invokeColdStart,
  platformEventName,
  preWarmInstance,
  startColdStartPool,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('cold-start axis — 3 platform', () => {
  it.each(platforms)('%s: first invoke is cold, second within TTL is warm', (platform) => {
    const session = startColdStartPool({ platform, warmedTtlMs: 60_000 });
    const cold = invokeColdStart(session, { instanceId: 'fn-a', nowMs: 1000 });
    expect(cold.state).toBe('cold');
    expect(cold.neutralEvent).toBe('cold-start.invoked');
    expect(cold.platformEvent).toBe(platformEventName(platform, 'cold-start.invoked'));

    const warm = invokeColdStart(session, { instanceId: 'fn-a', nowMs: 30_000 });
    expect(warm.state).toBe('warm');
    expect(warm.neutralEvent).toBe('cold-start.cache-hit');
  });

  it.each(platforms)('%s: provisioned instances always hit provisioned path', (platform) => {
    const session = startColdStartPool({ platform, provisionedIds: ['always-on'] });
    const step = invokeColdStart(session, { instanceId: 'always-on', nowMs: 0 });
    expect(step.state).toBe('provisioned');
    expect(step.neutralEvent).toBe('cold-start.provisioned-hit');
  });

  it('warm instance falls back to cold after TTL expires', () => {
    const session = startColdStartPool({ platform: 'cloudflare', warmedTtlMs: 10_000 });
    invokeColdStart(session, { instanceId: 'fn-a', nowMs: 0 });
    const step = invokeColdStart(session, { instanceId: 'fn-a', nowMs: 20_000 });
    expect(step.state).toBe('cold');
    expect(step.neutralEvent).toBe('cold-start.invoked');
  });

  it('preWarmInstance marks instance warm without cold path', () => {
    const session = startColdStartPool({ platform: 'vercel' });
    const step = preWarmInstance(session, { instanceId: 'fn-a', nowMs: 0 });
    expect(step.state).toBe('warm');
    expect(step.neutralEvent).toBe('cold-start.warmed');
    const invoke = invokeColdStart(session, { instanceId: 'fn-a', nowMs: 1000 });
    expect(invoke.state).toBe('warm');
  });

  it('evictExpired removes stale warm entries but keeps fresh ones', () => {
    const session = startColdStartPool({ platform: 'deno', warmedTtlMs: 10_000 });
    invokeColdStart(session, { instanceId: 'fn-a', nowMs: 0 });
    invokeColdStart(session, { instanceId: 'fn-b', nowMs: 15_000 });
    const evicted = evictExpired(session, { nowMs: 20_000 });
    expect(evicted).toBe(1);
    expect(session.warmedIds.has('fn-a')).toBe(false);
    expect(session.warmedIds.has('fn-b')).toBe(true);
  });

  it('provisioned instances are never evicted', () => {
    const session = startColdStartPool({
      platform: 'cloudflare',
      warmedTtlMs: 10_000,
      provisionedIds: ['always-on'],
    });
    invokeColdStart(session, { instanceId: 'always-on', nowMs: 0 });
    const evicted = evictExpired(session, { nowMs: 100_000 });
    expect(evicted).toBe(0);
    expect(session.provisionedIds.has('always-on')).toBe(true);
  });

  it('metadata carries pool size counts', () => {
    const session = startColdStartPool({
      platform: 'vercel',
      provisionedIds: ['p-1', 'p-2'],
    });
    invokeColdStart(session, { instanceId: 'fn-a', nowMs: 0 });
    invokeColdStart(session, { instanceId: 'fn-b', nowMs: 0 });
    expect(session.history.at(-1)?.metadata).toMatchObject({
      warmedCount: 2,
      provisionedCount: 2,
    });
  });

  it('records every invoke into history in order', () => {
    const session = startColdStartPool({ platform: 'deno', warmedTtlMs: 60_000 });
    invokeColdStart(session, { instanceId: 'fn-a', nowMs: 0 });
    invokeColdStart(session, { instanceId: 'fn-a', nowMs: 1000 });
    invokeColdStart(session, { instanceId: 'fn-b', nowMs: 2000 });
    expect(session.history.map((s) => s.state)).toEqual(['cold', 'warm', 'cold']);
  });

  it('defaults warmedTtlMs=60000', () => {
    const session = startColdStartPool({ platform: 'cloudflare' });
    expect(session.warmedTtlMs).toBe(60_000);
  });

  // The two tests below pin the `?? 0` defensive fallback in invokeColdStart and
  // evictExpired for a `warmedIds` entry whose `lastInvokeAtMs` entry is missing.
  // No helper API produces this state naturally (invokeColdStart / preWarmInstance
  // co-write both fields, evictExpired deletes both) — the state comes from
  // externally-persisted sessions where lastInvokeAtMs was truncated or from
  // serialization round-trips through partial JSON. The fallback exists so those
  // callers see a well-defined result instead of NaN; the tests document that.
  it('invokeColdStart tolerates warm entry with missing lastInvokeAtMs (defensive fallback)', () => {
    const session = startColdStartPool({ platform: 'cloudflare', warmedTtlMs: 60_000 });
    session.warmedIds.add('fn-orphan');
    const step = invokeColdStart(session, { instanceId: 'fn-orphan', nowMs: 1000 });
    expect(step.state).toBe('warm');
    expect(step.neutralEvent).toBe('cold-start.cache-hit');
  });

  it('evictExpired tolerates warm entry with missing lastInvokeAtMs (defensive fallback)', () => {
    const session = startColdStartPool({ platform: 'deno', warmedTtlMs: 10_000 });
    session.warmedIds.add('fn-orphan');
    const evicted = evictExpired(session, { nowMs: 20_000 });
    expect(evicted).toBe(1);
    expect(session.warmedIds.has('fn-orphan')).toBe(false);
  });
});
