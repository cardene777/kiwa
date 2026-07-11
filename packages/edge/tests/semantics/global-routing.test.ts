import { describe, expect, it } from 'vitest';
import {
  markUnhealthy,
  matchGeo,
  platformEventName,
  receiveAnycast,
  selectByLatency,
  startRoutingPool,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('global-routing axis — 3 platform', () => {
  it.each(platforms)('%s: anycast → geo → latency select happy path', (platform) => {
    const session = startRoutingPool({
      platform,
      pops: [
        { popId: 'us-east-1', region: 'us', latencyMs: 50, healthy: true },
        { popId: 'us-west-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'eu-1', region: 'eu', latencyMs: 200, healthy: true },
      ],
    });
    const anycast = receiveAnycast(session, { requestId: 'req-1' });
    expect(anycast.state).toBe('anycast');
    expect(anycast.neutralEvent).toBe('routing.anycast-received');
    expect(anycast.platformEvent).toBe(
      platformEventName(platform, 'routing.anycast-received'),
    );

    const geo = matchGeo(session, { requestId: 'req-1', region: 'us' });
    expect(geo.state).toBe('geo-matched');
    expect(geo.metadata.matchedCount).toBe(2);

    const picked = selectByLatency(session, { requestId: 'req-1', preferredRegion: 'us' });
    expect(picked.state).toBe('latency-selected');
    expect(picked.metadata).toMatchObject({ popId: 'us-west-1', latencyMs: 30 });
  });

  it('selectByLatency falls back to any healthy POP when preferred region empty', () => {
    const session = startRoutingPool({
      platform: 'cloudflare',
      pops: [{ popId: 'eu-1', region: 'eu', latencyMs: 200, healthy: true }],
    });
    const step = selectByLatency(session, { requestId: 'r', preferredRegion: 'us' });
    expect(step.state).toBe('failing-over');
    expect(step.metadata).toMatchObject({ fallbackPopId: 'eu-1', latencyPenaltyMs: 200 });
  });

  it('selectByLatency fallback picks lowest-latency when first candidate is not the minimum', () => {
    const session = startRoutingPool({
      platform: 'cloudflare',
      pops: [
        { popId: 'eu-1', region: 'eu', latencyMs: 300, healthy: true },
        { popId: 'ap-1', region: 'ap', latencyMs: 80, healthy: true },
      ],
    });
    const step = selectByLatency(session, { requestId: 'r', preferredRegion: 'us' });
    expect(step.state).toBe('failing-over');
    expect(step.metadata).toMatchObject({ fallbackPopId: 'ap-1', latencyPenaltyMs: 80 });
  });

  it('selectByLatency emits no-healthy-pops when all unhealthy', () => {
    const session = startRoutingPool({
      platform: 'vercel',
      pops: [{ popId: 'us-1', region: 'us', latencyMs: 30, healthy: false }],
    });
    const step = selectByLatency(session, { requestId: 'r' });
    expect(step.state).toBe('failing-over');
    expect(step.metadata).toMatchObject({ reason: 'no-healthy-pops' });
  });

  it('markUnhealthy excludes POP from future selection', () => {
    const session = startRoutingPool({
      platform: 'deno',
      pops: [
        { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'us-2', region: 'us', latencyMs: 50, healthy: true },
      ],
    });
    markUnhealthy(session, { popId: 'us-1' });
    const step = selectByLatency(session, { requestId: 'r' });
    expect(step.metadata.popId).toBe('us-2');
  });

  it('markUnhealthy rejects unknown POP', () => {
    const session = startRoutingPool({ platform: 'cloudflare', pops: [] });
    expect(() => markUnhealthy(session, { popId: 'nope' })).toThrow(/unknown popId/);
  });

  it('matchGeo returns 0 matched when region has no POP', () => {
    const session = startRoutingPool({
      platform: 'vercel',
      pops: [{ popId: 'us-1', region: 'us', latencyMs: 30, healthy: true }],
    });
    const step = matchGeo(session, { requestId: 'r', region: 'ap' });
    expect(step.metadata.matchedCount).toBe(0);
  });

  it('selectByLatency without preferredRegion picks global lowest-latency', () => {
    const session = startRoutingPool({
      platform: 'deno',
      pops: [
        { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'eu-1', region: 'eu', latencyMs: 20, healthy: true },
      ],
    });
    const step = selectByLatency(session, { requestId: 'r' });
    expect(step.metadata.popId).toBe('eu-1');
  });

  it('history accumulates every step in order', () => {
    const session = startRoutingPool({
      platform: 'cloudflare',
      pops: [{ popId: 'us-1', region: 'us', latencyMs: 30, healthy: true }],
    });
    receiveAnycast(session, { requestId: 'r' });
    matchGeo(session, { requestId: 'r', region: 'us' });
    selectByLatency(session, { requestId: 'r' });
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'routing.anycast-received',
      'routing.geo-matched',
      'routing.latency-selected',
    ]);
  });
});
