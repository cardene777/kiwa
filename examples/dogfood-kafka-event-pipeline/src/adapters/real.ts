/**
 * Real adapter — connects to a running Kafka broker via `KAFKA_BOOTSTRAP`
 * (host:port,host:port). When the env var is missing, the adapter reports
 * every op as `KAFKA_ENV_MISSING` so the fidelity harness records the gap.
 * Even when `KAFKA_BOOTSTRAP` is set, the v1.20-2 scope only wires the
 * connectivity aliveness probe + a `NOT_IMPLEMENTED` marker for higher-
 * level ops (the point is fidelity harness bring-up, not a production
 * kafkajs client).
 */

import type {
  ConsumerObservation,
  DlqObservation,
  KafkaEventPipelineAdapter,
  ProducerObservation,
  TraceEvent,
  TransactionObservation,
} from './interface.js';

export interface RealEnv {
  readonly bootstrap: string;
  readonly clientId: string;
}

export function detectRealEnv(): RealEnv | null {
  const bootstrap = process.env.KAFKA_BOOTSTRAP;
  if (!bootstrap) return null;
  const clientId = process.env.KAFKA_CLIENT_ID ?? 'dogfood-kafka-event-pipeline';
  return { bootstrap, clientId };
}

export class SkippedError extends Error {
  readonly code = 'KAFKA_ENV_MISSING';
  constructor(op: string) {
    super(`SkippedError: cannot execute ${op} because KAFKA_BOOTSTRAP is not set`);
  }
}

export async function makeRealAdapter(): Promise<KafkaEventPipelineAdapter> {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

type Metrics = ReturnType<KafkaEventPipelineAdapter['metrics']>;

function emptyMetrics(): Metrics {
  return {
    latencySamplesMs: [],
    producerRecordsSent: 0,
    consumerRecordsConsumed: 0,
    transactionsCommitted: 0,
    transactionsAborted: 0,
    dlqQuarantined: 0,
  };
}

function makeSkippedRealAdapter(): KafkaEventPipelineAdapter {
  const trace: TraceEvent[] = [];

  function fail<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'KAFKA_ENV_MISSING' });
    throw new SkippedError(op);
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    driveProducer: async () => fail<ProducerObservation>('driveProducer'),
    driveConsumerGroup: async () => fail<ConsumerObservation>('driveConsumerGroup'),
    driveTransaction: async () => fail<TransactionObservation>('driveTransaction'),
    driveDlq: async () => fail<DlqObservation>('driveDlq'),
    async emitFidelity() {
      trace.push({ op: 'emitFidelity', ok: false, errorKind: 'KAFKA_ENV_MISSING' });
    },
    metrics: () => emptyMetrics(),
    async reset() {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealEnv): KafkaEventPipelineAdapter {
  const trace: TraceEvent[] = [];

  async function aliveness(): Promise<boolean> {
    // Kafka has no HTTP aliveness endpoint by default — we probe by opening
    // a TCP connection to the first bootstrap broker. This is enough to
    // record "broker reachable" without pulling in kafkajs at this scope.
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

  function notImplemented<T>(op: string): Promise<T> {
    trace.push({ op, ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    return Promise.reject(
      new Error(`Real adapter for '${op}' is not implemented in the v1.20-2 scope`),
    );
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async driveProducer() {
      const ok = await aliveness();
      if (!ok) return notImplemented<ProducerObservation>('driveProducer');
      // Beyond aliveness, kafkajs would create the producer + send + wait
      // for ack. In the v1.20-2 scope we stop here so the fidelity harness
      // records "broker OK, producer NOT_IMPLEMENTED" — a well-defined
      // divergence.
      trace.push({
        op: 'driveProducer',
        ok: false,
        errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED',
      });
      return notImplemented<ProducerObservation>('driveProducer');
    },

    driveConsumerGroup: async () => notImplemented<ConsumerObservation>('driveConsumerGroup'),
    driveTransaction: async () => notImplemented<TransactionObservation>('driveTransaction'),
    driveDlq: async () => notImplemented<DlqObservation>('driveDlq'),

    async emitFidelity() {
      trace.push({
        op: 'emitFidelity',
        ok: true,
        detail: { mode: 'real', bootstrap: env.bootstrap },
      });
    },

    metrics: () => emptyMetrics(),

    async reset() {
      trace.length = 0;
    },
  };
}

