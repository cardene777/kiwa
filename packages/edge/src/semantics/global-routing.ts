import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * Global routing axis — Anycast + geo + latency-based failover. Edge
 * platforms receive requests on Anycast IPs and route them to the closest
 * healthy POP based on geo match, then latency probe, then failover if
 * the primary POP is unhealthy. The helper tracks POP health + observed
 * latencies so tests can drive the routing decision tree.
 */
export type RoutingState = 'anycast' | 'geo-matched' | 'latency-selected' | 'failing-over';

export interface Pop {
  popId: string;
  region: string;
  latencyMs: number;
  healthy: boolean;
}

export interface RoutingSession {
  platform: EdgePlatform;
  pops: Map<string, Pop>;
  history: AxisStep<RoutingState>[];
}

/**
 * Open a routing session with a POP pool. Each POP has a region tag,
 * measured latency, and health flag.
 */
export function startRoutingPool(input: {
  platform: EdgePlatform;
  pops: Pop[];
}): RoutingSession {
  const pops = new Map<string, Pop>();
  for (const p of input.pops) {
    pops.set(p.popId, p);
  }
  return {
    platform: input.platform,
    pops,
    history: [],
  };
}

/**
 * Receive an Anycast request at the network edge. Emits
 * `routing.anycast-received` and returns the initial state.
 */
export function receiveAnycast(
  session: RoutingSession,
  input: { requestId: string },
): AxisStep<RoutingState> {
  const step: AxisStep<RoutingState> = {
    neutralEvent: 'routing.anycast-received',
    platformEvent: platformEventName(session.platform, 'routing.anycast-received'),
    state: 'anycast',
    platform: session.platform,
    metadata: {
      requestId: input.requestId,
      popCount: session.pops.size,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Match request geo to a region. Returns POPs in that region (empty if
 * none). Emits `routing.geo-matched` with match count.
 */
export function matchGeo(
  session: RoutingSession,
  input: { requestId: string; region: string },
): AxisStep<RoutingState> {
  const inRegion = Array.from(session.pops.values()).filter(
    (p) => p.region === input.region,
  );
  const step: AxisStep<RoutingState> = {
    neutralEvent: 'routing.geo-matched',
    platformEvent: platformEventName(session.platform, 'routing.geo-matched'),
    state: 'geo-matched',
    platform: session.platform,
    metadata: {
      requestId: input.requestId,
      region: input.region,
      matchedCount: inRegion.length,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Select the lowest-latency healthy POP. If no healthy POP exists,
 * emits `routing.failover-triggered` and returns the healthiest fallback
 * (accepting some latency penalty).
 */
export function selectByLatency(
  session: RoutingSession,
  input: { requestId: string; preferredRegion?: string },
): AxisStep<RoutingState> {
  const inRegion = input.preferredRegion
    ? Array.from(session.pops.values()).filter(
      (p) => p.region === input.preferredRegion && p.healthy,
    )
    : Array.from(session.pops.values()).filter((p) => p.healthy);
  if (inRegion.length === 0) {
    const anyHealthy = Array.from(session.pops.values()).filter((p) => p.healthy);
    if (anyHealthy.length === 0) {
      const step: AxisStep<RoutingState> = {
        neutralEvent: 'routing.failover-triggered',
        platformEvent: platformEventName(session.platform, 'routing.failover-triggered'),
        state: 'failing-over',
        platform: session.platform,
        metadata: {
          requestId: input.requestId,
          reason: 'no-healthy-pops',
        },
      };
      session.history.push(step);
      return step;
    }
    const fallbackFirst = anyHealthy[0]!;
    const fallback = anyHealthy.reduce(
      (best, p) => (p.latencyMs < best.latencyMs ? p : best),
      fallbackFirst,
    );
    const step: AxisStep<RoutingState> = {
      neutralEvent: 'routing.failover-triggered',
      platformEvent: platformEventName(session.platform, 'routing.failover-triggered'),
      state: 'failing-over',
      platform: session.platform,
      metadata: {
        requestId: input.requestId,
        fallbackPopId: fallback.popId,
        fallbackRegion: fallback.region,
        latencyPenaltyMs: fallback.latencyMs,
      },
    };
    session.history.push(step);
    return step;
  }
  const firstInRegion = inRegion[0]!;
  const picked = inRegion.reduce(
    (best, p) => (p.latencyMs < best.latencyMs ? p : best),
    firstInRegion,
  );
  const step: AxisStep<RoutingState> = {
    neutralEvent: 'routing.latency-selected',
    platformEvent: platformEventName(session.platform, 'routing.latency-selected'),
    state: 'latency-selected',
    platform: session.platform,
    metadata: {
      requestId: input.requestId,
      popId: picked.popId,
      region: picked.region,
      latencyMs: picked.latencyMs,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Mark a POP unhealthy (e.g. probe failed). Later selectByLatency calls
 * will skip it.
 */
export function markUnhealthy(
  session: RoutingSession,
  input: { popId: string },
): void {
  const pop = session.pops.get(input.popId);
  if (!pop) {
    throw new Error(`markUnhealthy: unknown popId ${input.popId}`);
  }
  pop.healthy = false;
}
