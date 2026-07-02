import type {
  AutoReconnectOutcome,
  FederationIngestResult,
  OrderMessage,
  QueueAdapter,
  QueueDepthSnapshot,
  RetryOutcome,
  TraceEvent,
} from './interface.js';

/**
 * Real adapter — connects to a running rabbitmq:3-management broker via
 * `RABBITMQ_URL` (amqp://) + optional `RABBITMQ_MANAGEMENT_URL` (http://).
 * When the env vars are missing the adapter reports every op as
 * `RABBITMQ_ENV_MISSING` so the fidelity harness records the gap. Even when
 * `RABBITMQ_URL` is set, the v1.11-3 scope only wires the management-API
 * aliveness probe + a NOT_IMPLEMENTED marker for higher-level ops (the
 * point is fidelity harness bring-up, not a production RabbitMQ client).
 */

export interface RealEnv {
  amqpUrl: string;
  managementUrl: string;
}

export function detectRealEnv(): RealEnv | null {
  const amqpUrl = process.env.RABBITMQ_URL;
  if (!amqpUrl) return null;
  const explicit = process.env.RABBITMQ_MANAGEMENT_URL;
  if (explicit) return { amqpUrl, managementUrl: explicit };
  try {
    const url = new URL(amqpUrl);
    const host = url.hostname || 'localhost';
    return { amqpUrl, managementUrl: `http://${host}:15672` };
  } catch {
    return { amqpUrl, managementUrl: 'http://localhost:15672' };
  }
}

export class SkippedError extends Error {
  readonly code = 'RABBITMQ_ENV_MISSING';
  constructor(op: string) {
    super(`SkippedError: cannot execute ${op} because RABBITMQ_URL is not set`);
  }
}

export async function makeRealAdapter(): Promise<QueueAdapter> {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): QueueAdapter {
  const trace: TraceEvent[] = [];
  function fail<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'RABBITMQ_ENV_MISSING' });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    declareTopology: async () => fail('declareTopology'),
    processOrder: async () => fail('processOrder'),
    scheduleDelayedReminder: async () => fail('scheduleDelayedReminder'),
    processRetryPolicy: async () => fail('processRetryPolicy'),
    verifyQuorumSurvival: async () => fail('verifyQuorumSurvival'),
    ingestFromFederationUpstream: async () => fail('ingestFromFederationUpstream'),
    simulateReconnect: async () => fail('simulateReconnect'),
    reset: async () => {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealEnv): QueueAdapter {
  const trace: TraceEvent[] = [];

  async function aliveness(): Promise<boolean> {
    const url = `${env.managementUrl.replace(/\/$/, '')}/api/aliveness-test/%2F`;
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      trace.push({ op: 'management.aliveness', ok: res.ok });
      return res.ok;
    } catch (err) {
      trace.push({
        op: 'management.aliveness',
        ok: false,
        errorKind: (err as Error).message,
      });
      return false;
    }
  }

  function notImplemented<T>(op: string): Promise<T> {
    trace.push({ op, ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    return Promise.reject(
      new Error(`Real adapter for '${op}' is not implemented in the v1.11-3 scope`),
    );
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async declareTopology() {
      const ok = await aliveness();
      if (!ok) {
        return notImplemented('declareTopology');
      }
      // Beyond aliveness, we would use amqplib to assertExchange / assertQueue.
      // In the v1.11-3 scope we stop here so the fidelity harness records
      // "management OK, topology NOT_IMPLEMENTED" — a well-defined divergence.
      trace.push({ op: 'declareTopology', ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    },

    processOrder: async () => notImplemented<QueueDepthSnapshot>('processOrder'),
    scheduleDelayedReminder: async () =>
      notImplemented<{ delivered: boolean; outboxDepthAfter: number }>('scheduleDelayedReminder'),
    processRetryPolicy: async () => notImplemented<RetryOutcome>('processRetryPolicy'),
    verifyQuorumSurvival: async () =>
      notImplemented<{ survived: boolean }>('verifyQuorumSurvival'),
    ingestFromFederationUpstream: async () =>
      notImplemented<FederationIngestResult>('ingestFromFederationUpstream'),
    simulateReconnect: async () =>
      notImplemented<AutoReconnectOutcome>('simulateReconnect'),

    async reset() {
      trace.length = 0;
    },
  };
}

export function sampleOrder(overrides: Partial<OrderMessage> = {}): OrderMessage {
  return {
    id: 'ord-1',
    region: 'us',
    priority: 'high',
    total: 1250,
    valid: true,
    ...overrides,
  };
}
