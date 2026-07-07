import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

/**
 * Service mesh axis — Istio / Linkerd + mTLS + sidecar + circuit breaker
 * state machine (v2.2 advanced III).
 *
 * 4-step lifecycle: handshake-mtls → inject-sidecar → trip-circuit-breaker → apply-traffic-split.
 * SPIFFE ID pin + sidecar count + failure rate + weight sum を pure logic で検証。
 */

export type MeshState =
  | 'idle'
  | 'mtls-handshaked'
  | 'sidecar-injected'
  | 'circuit-breaker-tripped'
  | 'traffic-split-applied';

export interface MeshMtlsHandshake {
  clientSpiffe: string;
  serverSpiffe: string;
  cipherSuite: string;
}

export interface MeshSidecarInjection {
  pod: string;
  namespace: string;
  proxy: 'envoy' | 'linkerd2-proxy';
}

export interface MeshTrafficSplit {
  service: string;
  weight: number;
}

export interface MeshSession {
  target: ObservabilityTarget;
  meshName: string;
  state: MeshState;
  history: AxisStep<MeshState>[];
  handshake: MeshMtlsHandshake | null;
  sidecars: MeshSidecarInjection[];
  circuitBreakerOpen: boolean;
  trafficSplits: MeshTrafficSplit[];
}

export function startMeshSession(input: {
  target: ObservabilityTarget;
  meshName: string;
}): MeshSession {
  if (input.meshName.length === 0) {
    throw new Error('startMeshSession: meshName must not be empty');
  }
  return {
    target: input.target,
    meshName: input.meshName,
    state: 'idle',
    history: [],
    handshake: null,
    sidecars: [],
    circuitBreakerOpen: false,
    trafficSplits: [],
  };
}

export function handshakeMtls(
  session: MeshSession,
  input: MeshMtlsHandshake,
): AxisStep<MeshState> {
  if (session.state !== 'idle') {
    throw new Error(`handshakeMtls: session is ${session.state}, not idle`);
  }
  if (!input.clientSpiffe.startsWith('spiffe://')) {
    throw new Error('handshakeMtls: clientSpiffe must be a spiffe:// URI');
  }
  if (!input.serverSpiffe.startsWith('spiffe://')) {
    throw new Error('handshakeMtls: serverSpiffe must be a spiffe:// URI');
  }
  session.handshake = { ...input };
  session.state = 'mtls-handshaked';
  return emit(session, 'mesh.mtls_handshaked', {
    client: input.clientSpiffe,
    server: input.serverSpiffe,
    cipherSuite: input.cipherSuite,
  });
}

export function injectSidecar(
  session: MeshSession,
  input: { injections: MeshSidecarInjection[] },
): AxisStep<MeshState> {
  if (session.state !== 'mtls-handshaked') {
    throw new Error(`injectSidecar: session is ${session.state}, not mtls-handshaked`);
  }
  if (input.injections.length === 0) {
    throw new Error('injectSidecar: injections must not be empty');
  }
  session.sidecars = [...input.injections];
  session.state = 'sidecar-injected';
  const envoyCount = input.injections.filter((i) => i.proxy === 'envoy').length;
  const linkerdCount = input.injections.filter((i) => i.proxy === 'linkerd2-proxy').length;
  return emit(session, 'mesh.sidecar_injected', {
    sidecarCount: input.injections.length,
    envoyCount,
    linkerdCount,
  });
}

export function tripCircuitBreaker(
  session: MeshSession,
  input: { failures: number; total: number; failureThreshold: number },
): AxisStep<MeshState> {
  if (session.state !== 'sidecar-injected') {
    throw new Error(`tripCircuitBreaker: session is ${session.state}, not sidecar-injected`);
  }
  if (input.total <= 0) {
    throw new Error('tripCircuitBreaker: total must be positive');
  }
  if (input.failures < 0 || input.failures > input.total) {
    throw new Error('tripCircuitBreaker: failures must be within [0, total]');
  }
  const failureRate = input.failures / input.total;
  const tripped = failureRate >= input.failureThreshold;
  session.circuitBreakerOpen = tripped;
  session.state = 'circuit-breaker-tripped';
  return emit(session, 'mesh.circuit_breaker_tripped', {
    tripped,
    failureRate,
    failureThreshold: input.failureThreshold,
    failures: input.failures,
    total: input.total,
  });
}

export function applyTrafficSplit(
  session: MeshSession,
  input: { splits: MeshTrafficSplit[] },
): AxisStep<MeshState> {
  if (session.state !== 'circuit-breaker-tripped') {
    throw new Error(`applyTrafficSplit: session is ${session.state}, not circuit-breaker-tripped`);
  }
  if (input.splits.length === 0) {
    throw new Error('applyTrafficSplit: splits must not be empty');
  }
  const totalWeight = input.splits.reduce((acc, s) => acc + s.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.0001) {
    throw new Error(`applyTrafficSplit: weights must sum to 100 (got ${totalWeight})`);
  }
  for (const s of input.splits) {
    if (s.weight < 0 || s.weight > 100) {
      throw new Error(`applyTrafficSplit: weight for ${s.service} must be within [0, 100]`);
    }
  }
  session.trafficSplits = [...input.splits];
  session.state = 'traffic-split-applied';
  return emit(session, 'mesh.traffic_split_applied', {
    serviceCount: input.splits.length,
    totalWeight,
  });
}

function emit(
  session: MeshSession,
  neutralEvent: AxisStep<MeshState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<MeshState> {
  const step: AxisStep<MeshState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, meshName: session.meshName, ...metadata },
  };
  session.history.push(step);
  return step;
}
