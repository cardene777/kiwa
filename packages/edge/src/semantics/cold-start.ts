import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * Cold-start axis — serverless function warm/cold path + provisioned concurrency.
 * Real edge runtimes distinguish `cold` (VM allocation + JIT), `warm` (recent
 * eviction still in cache), and `provisioned` (always-on reserved instance)
 * paths — each hits a different latency profile. The helper tracks the pool
 * of warm instances and provisioned reservations, then returns which class
 * the next invocation lands in.
 */
export type ColdStartClass = 'cold' | 'warm' | 'provisioned';

export interface ColdStartSession {
  platform: EdgePlatform;
  warmedIds: Set<string>;
  provisionedIds: Set<string>;
  warmedTtlMs: number;
  lastInvokeAtMs: Record<string, number>;
  history: AxisStep<ColdStartClass>[];
}

/**
 * Open a cold-start pool. `warmedTtlMs` defines how long a warm instance
 * lives after last invocation before eviction. `provisionedIds` are
 * always-on reservations that never fall back to cold.
 */
export function startColdStartPool(input: {
  platform: EdgePlatform;
  warmedTtlMs?: number;
  provisionedIds?: string[];
}): ColdStartSession {
  return {
    platform: input.platform,
    warmedIds: new Set(),
    provisionedIds: new Set(input.provisionedIds ?? []),
    warmedTtlMs: input.warmedTtlMs ?? 60_000,
    lastInvokeAtMs: {},
    history: [],
  };
}

/**
 * Invoke a function with `instanceId` at simulated wall-clock `nowMs`. The
 * class emitted depends on pool state — `provisioned` if reserved,
 * `warm` if within TTL of last invoke, `cold` otherwise. After invocation
 * the instance is marked warm.
 */
export function invokeColdStart(
  session: ColdStartSession,
  input: { instanceId: string; nowMs: number },
): AxisStep<ColdStartClass> {
  const { instanceId, nowMs } = input;
  let cls: ColdStartClass;
  let neutralEvent: 'cold-start.invoked' | 'cold-start.cache-hit' | 'cold-start.provisioned-hit';
  if (session.provisionedIds.has(instanceId)) {
    cls = 'provisioned';
    neutralEvent = 'cold-start.provisioned-hit';
  } else if (
    session.warmedIds.has(instanceId) &&
    nowMs - (session.lastInvokeAtMs[instanceId] ?? 0) <= session.warmedTtlMs
  ) {
    cls = 'warm';
    neutralEvent = 'cold-start.cache-hit';
  } else {
    cls = 'cold';
    neutralEvent = 'cold-start.invoked';
    session.warmedIds.add(instanceId);
  }
  session.lastInvokeAtMs[instanceId] = nowMs;
  const step: AxisStep<ColdStartClass> = {
    neutralEvent,
    platformEvent: platformEventName(session.platform, neutralEvent),
    state: cls,
    platform: session.platform,
    metadata: {
      instanceId,
      nowMs,
      warmedCount: session.warmedIds.size,
      provisionedCount: session.provisionedIds.size,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Explicitly pre-warm an instance without producing latency (e.g. via
 * scheduled ping). Emits `cold-start.warmed` and marks the instance warm.
 */
export function preWarmInstance(
  session: ColdStartSession,
  input: { instanceId: string; nowMs: number },
): AxisStep<ColdStartClass> {
  session.warmedIds.add(input.instanceId);
  session.lastInvokeAtMs[input.instanceId] = input.nowMs;
  const step: AxisStep<ColdStartClass> = {
    neutralEvent: 'cold-start.warmed',
    platformEvent: platformEventName(session.platform, 'cold-start.warmed'),
    state: 'warm',
    platform: session.platform,
    metadata: {
      instanceId: input.instanceId,
      nowMs: input.nowMs,
      warmedCount: session.warmedIds.size,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Evict warm instances whose last invocation is older than TTL at the
 * simulated wall-clock `nowMs`. Returns the count evicted. Provisioned
 * instances are never evicted.
 */
export function evictExpired(session: ColdStartSession, input: { nowMs: number }): number {
  let evicted = 0;
  for (const id of Array.from(session.warmedIds)) {
    const last = session.lastInvokeAtMs[id] ?? 0;
    if (input.nowMs - last > session.warmedTtlMs) {
      session.warmedIds.delete(id);
      delete session.lastInvokeAtMs[id];
      evicted++;
    }
  }
  return evicted;
}
