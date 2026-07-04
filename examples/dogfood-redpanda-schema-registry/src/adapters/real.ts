/**
 * Real adapter — connects to a running Redpanda broker via
 * `REDPANDA_BOOTSTRAP` (host:port,host:port) + a running Confluent-shaped
 * Schema Registry via `SCHEMA_REGISTRY_URL` (http://host:port). When either
 * env var is missing, the adapter reports every op as `REDPANDA_ENV_MISSING`
 * so the fidelity harness records the gap.
 *
 * Even when both env vars are set, the v1.20-3 scope only wires the
 * connectivity aliveness probes + a `NOT_IMPLEMENTED` marker for higher-
 * level ops (the point is fidelity harness bring-up, not a production
 * kafkajs / confluent-schema-registry client).
 */

import type {
  CompatibilityObservation,
  EvolutionObservation,
  PublishObservation,
  RedpandaSchemaRegistryAdapter,
  RegisterObservation,
  TraceEvent,
} from './interface.js';

export interface RealEnv {
  readonly bootstrap: string;
  readonly registryUrl: string;
  readonly clientId: string;
}

export function detectRealEnv(): RealEnv | null {
  const bootstrap = process.env.REDPANDA_BOOTSTRAP;
  const registryUrl = process.env.SCHEMA_REGISTRY_URL;
  if (!bootstrap || !registryUrl) return null;
  const clientId = process.env.REDPANDA_CLIENT_ID ?? 'dogfood-redpanda-schema-registry';
  return { bootstrap, registryUrl, clientId };
}

export class SkippedError extends Error {
  readonly code = 'REDPANDA_ENV_MISSING';
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because REDPANDA_BOOTSTRAP or SCHEMA_REGISTRY_URL is not set`,
    );
  }
}

export async function makeRealAdapter(): Promise<RedpandaSchemaRegistryAdapter> {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

type Metrics = ReturnType<RedpandaSchemaRegistryAdapter['metrics']>;

function emptyMetrics(): Metrics {
  return {
    latencySamplesMs: [],
    subjectsRegistered: 0,
    recordsPublished: 0,
    compatibilityRejections: 0,
    evolutionSteps: 0,
  };
}

function makeSkippedRealAdapter(): RedpandaSchemaRegistryAdapter {
  const trace: TraceEvent[] = [];

  function fail<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'REDPANDA_ENV_MISSING' });
    throw new SkippedError(op);
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    driveRegister: async () => fail<RegisterObservation>('driveRegister'),
    driveEvolution: async () => fail<EvolutionObservation>('driveEvolution'),
    driveCompatibilityModes: async () =>
      fail<CompatibilityObservation>('driveCompatibilityModes'),
    drivePublish: async () => fail<PublishObservation>('drivePublish'),
    async emitFidelity() {
      trace.push({ op: 'emitFidelity', ok: false, errorKind: 'REDPANDA_ENV_MISSING' });
    },
    metrics: () => emptyMetrics(),
    async reset() {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealEnv): RedpandaSchemaRegistryAdapter {
  const trace: TraceEvent[] = [];

  async function brokerAliveness(): Promise<boolean> {
    // Redpanda speaks Kafka wire on the bootstrap host — TCP connect is
    // enough to record "broker reachable" without pulling in kafkajs at this
    // scope.
    const first = env.bootstrap.split(',')[0];
    if (!first) return false;
    const [host, portStr] = first.split(':');
    if (!host || !portStr) return false;
    const port = Number(portStr);
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
      trace.push({ op: 'broker.aliveness', ok: true, detail: { bootstrap: env.bootstrap } });
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

  async function registryAliveness(): Promise<boolean> {
    // Confluent SR + Redpanda's bundled SR both expose GET /subjects as the
    // canonical aliveness probe. A 200 status = SR reachable.
    try {
      const url = new URL('/subjects', env.registryUrl);
      const response = await fetch(url.toString(), { method: 'GET' });
      const ok = response.status === 200;
      trace.push({
        op: 'registry.aliveness',
        ok,
        detail: { registryUrl: env.registryUrl, status: response.status },
      });
      return ok;
    } catch (err) {
      trace.push({
        op: 'registry.aliveness',
        ok: false,
        errorKind: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }

  function notImplemented<T>(op: string): Promise<T> {
    trace.push({ op, ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    return Promise.reject(
      new Error(`Real adapter for '${op}' is not implemented in the v1.20-3 scope`),
    );
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async driveRegister() {
      const brokerOk = await brokerAliveness();
      const registryOk = await registryAliveness();
      if (!brokerOk || !registryOk) return notImplemented<RegisterObservation>('driveRegister');
      trace.push({
        op: 'driveRegister',
        ok: false,
        errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED',
      });
      return notImplemented<RegisterObservation>('driveRegister');
    },
    driveEvolution: async () => notImplemented<EvolutionObservation>('driveEvolution'),
    driveCompatibilityModes: async () =>
      notImplemented<CompatibilityObservation>('driveCompatibilityModes'),
    drivePublish: async () => notImplemented<PublishObservation>('drivePublish'),

    async emitFidelity() {
      trace.push({
        op: 'emitFidelity',
        ok: true,
        detail: {
          mode: 'real',
          bootstrap: env.bootstrap,
          registryUrl: env.registryUrl,
        },
      });
    },

    metrics: () => emptyMetrics(),

    async reset() {
      trace.length = 0;
    },
  };
}
