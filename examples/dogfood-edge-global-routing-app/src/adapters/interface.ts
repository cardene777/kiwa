/**
 * Provider-neutral global routing surface for the
 * dogfood-edge-global-routing-app.
 *
 * The app talks to the Anycast + geo routing + latency-based failover +
 * read replica affinity stack only through this interface. Two
 * implementations exist —
 *  - {@link makeRealAdapter} — drives Cloudflare Anycast + Vercel Geo +
 *    Deno Deploy routing APIs when env-ready.
 *  - {@link makeMockAdapter} — backed by `@kiwa-lab/edge` v1.2 advanced
 *    global-routing + d1-read-replica semantics.
 *
 * 12-op contract — 3 axes × 4 ops (anycast-routing / geo-matching /
 * replica-affinity).
 */

import type { EdgePlatform as EdgeEdgePlatform } from '@kiwa-lab/edge';

export type EdgePlatform = EdgeEdgePlatform;

/** A single Point-of-Presence descriptor. */
export interface Pop {
  popId: string;
  region: string;
  latencyMs: number;
  healthy: boolean;
}

/** A single read replica descriptor. */
export interface Replica {
  replicaId: string;
  region: string;
  lagMs: number;
}

export interface RoutingSession {
  sessionId: string;
  platform: EdgePlatform;
  pops: Pop[];
}

export interface ReplicaSession {
  sessionId: string;
  platform: EdgePlatform;
  primaryId: string;
  replicas: Replica[];
}

export interface RoutingStep {
  op: string;
  outcome: 'success' | 'env-missing' | 'error';
  metadata: Record<string, string | number | boolean>;
}

export interface EdgeRoutingAdapter {
  // anycast-routing axis
  startAnycast: (input: { platform: EdgePlatform; pops: Pop[] }) => Promise<RoutingSession>;
  receiveAnycastReq: (session: RoutingSession, input: { requestId: string }) => Promise<RoutingStep>;
  markPopUnhealthy: (session: RoutingSession, input: { popId: string }) => Promise<RoutingStep>;
  closeAnycast: (session: RoutingSession) => Promise<void>;
  // geo-matching axis
  startGeoMatching: (input: { platform: EdgePlatform; pops: Pop[] }) => Promise<RoutingSession>;
  matchGeoRegion: (session: RoutingSession, input: { requestId: string; region: string }) => Promise<RoutingStep>;
  selectLowestLatency: (
    session: RoutingSession,
    input: { requestId: string; preferredRegion?: string },
  ) => Promise<RoutingStep>;
  closeGeoMatching: (session: RoutingSession) => Promise<void>;
  // replica-affinity axis
  startReplicaAffinity: (input: {
    platform: EdgePlatform;
    primaryId: string;
    replicas: Replica[];
  }) => Promise<ReplicaSession>;
  readFromClosestReplica: (
    session: ReplicaSession,
    input: { query: string; preferredRegion?: string },
  ) => Promise<RoutingStep>;
  reportReplicaLag: (
    session: ReplicaSession,
    input: { replicaId: string; lagMs: number },
  ) => Promise<RoutingStep>;
  closeReplicaAffinity: (session: ReplicaSession) => Promise<void>;
}
