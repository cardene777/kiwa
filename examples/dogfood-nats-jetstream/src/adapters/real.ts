/**
 * Real adapter — probes a live NATS broker via `NATS_URL`
 * (`nats://host:port,nats://host:port`). When the env var is missing,
 * the adapter reports every op as `NATS_ENV_MISSING` so the fidelity
 * harness records the gap.
 *
 * Even when `NATS_URL` is set, the v1.20-4 scope only wires the
 * connectivity aliveness probe + a `NOT_IMPLEMENTED` marker for higher-
 * level ops (the point is fidelity harness bring-up, not a production
 * nats.js JetStream / KV / Object client).
 */

import type {
  JetStreamObservation,
  KVObservation,
  NatsJetStreamAdapter,
  ObjectObservation,
  RoutingObservation,
  TraceEvent,
} from './interface.js';

export interface RealEnv {
  readonly url: string;
  readonly clientName: string;
}

export function detectRealEnv(): RealEnv | null {
  const url = process.env.NATS_URL;
  if (!url) return null;
  const clientName = process.env.NATS_CLIENT_NAME ?? 'dogfood-nats-jetstream';
  return { url, clientName };
}

export class SkippedError extends Error {
  readonly code = 'NATS_ENV_MISSING';
  constructor(op: string) {
    super(`SkippedError: cannot execute ${op} because NATS_URL is not set`);
  }
}

export async function makeRealAdapter(): Promise<NatsJetStreamAdapter> {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

type Metrics = ReturnType<NatsJetStreamAdapter['metrics']>;

function emptyMetrics(): Metrics {
  return {
    latencySamplesMs: [],
    jetstreamPublished: 0,
    jetstreamAcked: 0,
    kvOperations: 0,
    objectBytesStored: 0,
    routingDeliveries: 0,
  };
}

function makeSkippedRealAdapter(): NatsJetStreamAdapter {
  const trace: TraceEvent[] = [];

  function fail<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'NATS_ENV_MISSING' });
    throw new SkippedError(op);
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    driveJetStream: async () => fail<JetStreamObservation>('driveJetStream'),
    driveKV: async () => fail<KVObservation>('driveKV'),
    driveObject: async () => fail<ObjectObservation>('driveObject'),
    driveRouting: async () => fail<RoutingObservation>('driveRouting'),
    async emitFidelity() {
      trace.push({ op: 'emitFidelity', ok: false, errorKind: 'NATS_ENV_MISSING' });
    },
    metrics: () => emptyMetrics(),
    async reset() {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealEnv): NatsJetStreamAdapter {
  const trace: TraceEvent[] = [];

  async function brokerAliveness(): Promise<boolean> {
    // NATS speaks its own protocol on the default 4222 port. TCP connect
    // is enough to record "broker reachable" without pulling in nats.js
    // at this scope. We support the multi-URL form (`nats://a:4222,nats://b:4222`).
    const first = env.url.split(',')[0];
    if (!first) return false;
    let host = 'localhost';
    let port = 4222;
    try {
      const parsed = new URL(first);
      host = parsed.hostname || host;
      if (parsed.port) port = Number(parsed.port);
    } catch {
      // Fall back to naked host:port parsing (`localhost:4222`).
      const [rawHost, rawPort] = first.split(':');
      if (rawHost) host = rawHost;
      if (rawPort) port = Number(rawPort);
    }
    if (!Number.isFinite(port)) return false;
    try {
      const net = await import('node:net');
      await new Promise<void>((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(500);
        socket.once('connect', () => {
          socket.end();
          resolve();
        });
        socket.once('timeout', () => {
          socket.destroy();
          reject(new Error('timeout'));
        });
        socket.once('error', (err) => reject(err));
        socket.connect(port, host);
      });
      trace.push({ op: 'broker.aliveness', ok: true, detail: { url: env.url } });
      return true;
    } catch (err) {
      trace.push({
        op: 'broker.aliveness',
        ok: false,
        errorKind: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }

  function notImplemented<T>(op: string): Promise<T> {
    trace.push({ op, ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    return Promise.reject(
      new Error(`Real adapter for '${op}' is not implemented in the v1.20-4 scope`),
    );
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async driveJetStream() {
      const brokerOk = await brokerAliveness();
      if (!brokerOk) return notImplemented<JetStreamObservation>('driveJetStream');
      trace.push({
        op: 'driveJetStream',
        ok: false,
        errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED',
      });
      return notImplemented<JetStreamObservation>('driveJetStream');
    },
    driveKV: async () => notImplemented<KVObservation>('driveKV'),
    driveObject: async () => notImplemented<ObjectObservation>('driveObject'),
    driveRouting: async () => notImplemented<RoutingObservation>('driveRouting'),

    async emitFidelity() {
      trace.push({
        op: 'emitFidelity',
        ok: true,
        detail: { mode: 'real', url: env.url },
      });
    },

    metrics: () => emptyMetrics(),

    async reset() {
      trace.length = 0;
    },
  };
}
