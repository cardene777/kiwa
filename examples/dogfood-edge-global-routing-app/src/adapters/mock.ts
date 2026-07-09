/**
 * Mock adapter — walks the edge global-routing + d1-read-replica state
 * machines from @kiwa-lab/edge v1.2 semantics deterministically.
 */
import {
  markUnhealthy,
  matchGeo,
  readFromReplica,
  receiveAnycast,
  reportLag,
  selectByLatency,
  startD1,
  startRoutingPool,
  type D1Session,
  type RoutingSession as EdgeRoutingSession,
} from '@kiwa-lab/edge';
import type {
  EdgeRoutingAdapter,
  ReplicaSession,
  RoutingSession,
  RoutingStep,
} from './interface.js';

interface MockContext {
  routingSessions: Map<string, EdgeRoutingSession>;
  replicaSessions: Map<string, D1Session>;
  ops: number;
}

export function makeMockAdapter(): EdgeRoutingAdapter {
  const ctx: MockContext = {
    routingSessions: new Map(),
    replicaSessions: new Map(),
    ops: 0,
  };
  return {
    // anycast-routing axis
    startAnycast: async ({ platform, pops }) => {
      ctx.ops++;
      const machine = startRoutingPool({ platform, pops });
      const session: RoutingSession = {
        sessionId: `anycast-${ctx.ops}`,
        platform,
        pops,
      };
      ctx.routingSessions.set(session.sessionId, machine);
      return session;
    },
    receiveAnycastReq: async (session, { requestId }) => {
      const machine = ctx.routingSessions.get(session.sessionId);
      if (!machine) throw new Error(`receiveAnycastReq: unknown sessionId ${session.sessionId}`);
      const step = receiveAnycast(machine, { requestId });
      return {
        op: 'receiveAnycastReq',
        outcome: 'success',
        metadata: {
          requestId,
          neutralEvent: step.neutralEvent,
          popCount: Number(step.metadata.popCount ?? 0),
        },
      } satisfies RoutingStep;
    },
    markPopUnhealthy: async (session, { popId }) => {
      const machine = ctx.routingSessions.get(session.sessionId);
      if (!machine) throw new Error(`markPopUnhealthy: unknown sessionId ${session.sessionId}`);
      markUnhealthy(machine, { popId });
      return {
        op: 'markPopUnhealthy',
        outcome: 'success',
        metadata: { popId },
      };
    },
    closeAnycast: async (session) => {
      ctx.routingSessions.delete(session.sessionId);
    },
    // geo-matching axis
    startGeoMatching: async ({ platform, pops }) => {
      ctx.ops++;
      const machine = startRoutingPool({ platform, pops });
      const session: RoutingSession = { sessionId: `geo-${ctx.ops}`, platform, pops };
      ctx.routingSessions.set(session.sessionId, machine);
      return session;
    },
    matchGeoRegion: async (session, { requestId, region }) => {
      const machine = ctx.routingSessions.get(session.sessionId);
      if (!machine) throw new Error(`matchGeoRegion: unknown sessionId ${session.sessionId}`);
      const step = matchGeo(machine, { requestId, region });
      return {
        op: 'matchGeoRegion',
        outcome: 'success',
        metadata: {
          region,
          neutralEvent: step.neutralEvent,
          matchedCount: Number(step.metadata.matchedCount ?? 0),
        },
      };
    },
    selectLowestLatency: async (session, input) => {
      const machine = ctx.routingSessions.get(session.sessionId);
      if (!machine) throw new Error(`selectLowestLatency: unknown sessionId ${session.sessionId}`);
      const step = selectByLatency(machine, input);
      return {
        op: 'selectLowestLatency',
        outcome: 'success',
        metadata: {
          requestId: input.requestId,
          neutralEvent: step.neutralEvent,
          popId: String(step.metadata.popId ?? step.metadata.fallbackPopId ?? ''),
        },
      };
    },
    closeGeoMatching: async (session) => {
      ctx.routingSessions.delete(session.sessionId);
    },
    // replica-affinity axis
    startReplicaAffinity: async ({ platform, primaryId, replicas }) => {
      ctx.ops++;
      const machine = startD1({
        platform,
        primaryId,
        replicas,
      });
      const session: ReplicaSession = {
        sessionId: `replica-${ctx.ops}`,
        platform,
        primaryId,
        replicas,
      };
      ctx.replicaSessions.set(session.sessionId, machine);
      return session;
    },
    readFromClosestReplica: async (session, input) => {
      const machine = ctx.replicaSessions.get(session.sessionId);
      if (!machine) throw new Error(`readFromClosestReplica: unknown sessionId ${session.sessionId}`);
      const step = readFromReplica(machine, input);
      return {
        op: 'readFromClosestReplica',
        outcome: 'success',
        metadata: {
          query: input.query,
          neutralEvent: step.neutralEvent,
          state: step.state,
        },
      };
    },
    reportReplicaLag: async (session, input) => {
      const machine = ctx.replicaSessions.get(session.sessionId);
      if (!machine) throw new Error(`reportReplicaLag: unknown sessionId ${session.sessionId}`);
      const step = reportLag(machine, input);
      return {
        op: 'reportReplicaLag',
        outcome: 'success',
        metadata: {
          replicaId: input.replicaId,
          lagMs: input.lagMs,
          healthy: Boolean(step.metadata.healthy ?? false),
        },
      };
    },
    closeReplicaAffinity: async (session) => {
      ctx.replicaSessions.delete(session.sessionId);
    },
  };
}
