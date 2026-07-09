/**
 * Mock adapter — walks the edge cold-start + middleware + routing state
 * machines from @kiwa-lab/edge v1.2 semantics deterministically.
 */
import {
  invokeColdStart,
  preWarmInstance,
  startColdStartPool,
  type ColdStartSession,
} from '@kiwa-lab/edge';
import type {
  EdgeColdStartAdapter,
  EdgePlatform,
  EdgeSession,
  LatencyMeasurement,
  TraceStep,
} from './interface.js';

/** Latency profile in ms per class. */
const LATENCY_MS: Record<'cold' | 'warm' | 'provisioned', number> = {
  cold: 250,
  warm: 30,
  provisioned: 5,
};

interface MockContext {
  sessions: Map<string, ColdStartSession>;
  ops: number;
}

export function makeMockAdapter(): EdgeColdStartAdapter {
  const ctx: MockContext = { sessions: new Map(), ops: 0 };
  const newSession = (platform: EdgePlatform, prefix: string): EdgeSession => {
    ctx.ops++;
    const sessionId = `${prefix}-${ctx.ops}`;
    const pool = startColdStartPool({ platform, warmedTtlMs: 60_000 });
    ctx.sessions.set(sessionId, pool);
    return { sessionId, platform, startedAtMs: 0 };
  };
  return {
    // cold axis
    startCold: async (input) => newSession(input.platform, 'cold'),
    invokeCold: async ({ sessionId, instanceId, nowMs, platform }) => {
      const pool = ctx.sessions.get(sessionId);
      if (!pool) throw new Error(`invokeCold: unknown sessionId ${sessionId}`);
      const step = invokeColdStart(pool, { instanceId, nowMs });
      const cls = step.state;
      return {
        cls,
        latencyMs: LATENCY_MS[cls],
        instanceId,
      } satisfies LatencyMeasurement & { instanceId: string };
    },
    measureLatencyCold: async ({ cls }) => LATENCY_MS[cls],
    closeCold: async ({ sessionId }) => {
      ctx.sessions.delete(sessionId);
    },
    // warm axis
    startWarm: async (input) => newSession(input.platform, 'warm'),
    preWarm: async ({ sessionId, instanceId, nowMs }) => {
      const pool = ctx.sessions.get(sessionId);
      if (!pool) throw new Error(`preWarm: unknown sessionId ${sessionId}`);
      const step = preWarmInstance(pool, { instanceId, nowMs });
      return {
        op: 'preWarm',
        outcome: 'success',
        metadata: {
          instanceId,
          nowMs,
          neutralEvent: step.neutralEvent,
        },
      } satisfies TraceStep;
    },
    invokeWarm: async ({ sessionId, instanceId, nowMs }) => {
      const pool = ctx.sessions.get(sessionId);
      if (!pool) throw new Error(`invokeWarm: unknown sessionId ${sessionId}`);
      const step = invokeColdStart(pool, { instanceId, nowMs });
      const cls = step.state;
      return { cls, latencyMs: LATENCY_MS[cls], instanceId };
    },
    closeWarm: async ({ sessionId }) => {
      ctx.sessions.delete(sessionId);
    },
    // provisioned axis
    startProvisioned: async (input) => newSession(input.platform, 'prov'),
    reserveProvisioned: async ({ sessionId, instanceIds, platform }) => {
      const pool = startColdStartPool({
        platform,
        provisionedIds: instanceIds,
      });
      ctx.sessions.set(sessionId, pool);
      return {
        op: 'reserveProvisioned',
        outcome: 'success',
        metadata: {
          reservedCount: instanceIds.length,
        },
      } satisfies TraceStep;
    },
    invokeProvisioned: async ({ sessionId, instanceId, nowMs }) => {
      const pool = ctx.sessions.get(sessionId);
      if (!pool) throw new Error(`invokeProvisioned: unknown sessionId ${sessionId}`);
      const step = invokeColdStart(pool, { instanceId, nowMs });
      const cls = step.state;
      return { cls, latencyMs: LATENCY_MS[cls], instanceId };
    },
    closeProvisioned: async ({ sessionId }) => {
      ctx.sessions.delete(sessionId);
    },
  };
}
