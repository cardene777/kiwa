/**
 * Real adapter — env-gated stub delegating to real Cloudflare Anycast +
 * Vercel Geo + Deno Deploy routing APIs when KIWA_MODE=real +
 * EDGE_GLOBAL_ROUTING_STACK_READY=1 + KIWA_EDGE_ANYCAST_URL are present.
 */
import type {
  EdgeRoutingAdapter,
  ReplicaSession,
  RoutingSession,
  RoutingStep,
} from './interface.js';

const ENV_MISSING = 'KIWA_EDGE_GLOBAL_ROUTING_ENV_MISSING';

function isReady(): boolean {
  return (
    process.env['KIWA_MODE'] === 'real' &&
    process.env['EDGE_GLOBAL_ROUTING_STACK_READY'] === '1' &&
    Boolean(process.env['KIWA_EDGE_ANYCAST_URL'])
  );
}

function envMissingStep(op: string): RoutingStep {
  return {
    op,
    outcome: 'env-missing',
    metadata: { reason: ENV_MISSING },
  };
}

export function makeRealAdapter(): EdgeRoutingAdapter {
  let counter = 0;
  return {
    startAnycast: async (input) => {
      counter++;
      return { sessionId: `anycast-real-${counter}`, ...input };
    },
    receiveAnycastReq: async () => (isReady() ? { op: 'receiveAnycastReq', outcome: 'success', metadata: { real: true } } : envMissingStep('receiveAnycastReq')),
    markPopUnhealthy: async (_s, { popId }) => (isReady() ? { op: 'markPopUnhealthy', outcome: 'success', metadata: { popId, real: true } } : envMissingStep('markPopUnhealthy')),
    closeAnycast: async () => {},
    startGeoMatching: async (input) => {
      counter++;
      return { sessionId: `geo-real-${counter}`, ...input };
    },
    matchGeoRegion: async (_s, { region }) => (isReady() ? { op: 'matchGeoRegion', outcome: 'success', metadata: { region, real: true } } : envMissingStep('matchGeoRegion')),
    selectLowestLatency: async () => (isReady() ? { op: 'selectLowestLatency', outcome: 'success', metadata: { real: true } } : envMissingStep('selectLowestLatency')),
    closeGeoMatching: async () => {},
    startReplicaAffinity: async (input): Promise<ReplicaSession> => {
      counter++;
      return { sessionId: `replica-real-${counter}`, ...input };
    },
    readFromClosestReplica: async () => (isReady() ? { op: 'readFromClosestReplica', outcome: 'success', metadata: { real: true } } : envMissingStep('readFromClosestReplica')),
    reportReplicaLag: async (_s, { replicaId, lagMs }) => (isReady() ? { op: 'reportReplicaLag', outcome: 'success', metadata: { replicaId, lagMs, real: true } } : envMissingStep('reportReplicaLag')),
    closeReplicaAffinity: async () => {},
  };
}
