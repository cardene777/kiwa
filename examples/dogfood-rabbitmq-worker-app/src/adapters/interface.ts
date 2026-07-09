/**
 * Queue adapter surface for the RabbitMQ dogfood worker.
 *
 * The worker talks to RabbitMQ only through this interface. `makeMockAdapter`
 * wraps `@kiwa-lab/queue`'s basic + advanced envs (v1.10-3 + v1.10-4);
 * `makeRealAdapter` talks to a live rabbitmq:3-management broker via amqplib
 * whenever `RABBITMQ_URL` is exported. When the env var is missing, the real
 * adapter enters a graceful-skip mode so the fidelity harness records the
 * gap instead of failing the whole run.
 */

export interface OrderMessage {
  id: string;
  region: 'us' | 'eu' | 'apac';
  priority: 'low' | 'high';
  total: number;
  valid: boolean;
}

export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface QueueDepthSnapshot {
  main: number;
  triage: number;
  outbox: number;
}

export interface RetryOutcome {
  finalDeliveryCount: number;
  eventuallySucceeded: boolean;
}

export interface FederationIngestResult {
  fromUpstream: string;
  landedOnQueue: string;
  depthAfter: number;
}

export interface AutoReconnectOutcome {
  attempts: number;
  totalDelayMs: number;
  succeeded: boolean;
}

export interface QueueAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /** Declare the full topology used by the worker. */
  declareTopology(): Promise<void>;

  /** Publish + consume one order — invalid payloads are nacked into the DLX. */
  processOrder(order: OrderMessage): Promise<QueueDepthSnapshot>;

  /** Deterministic delayed message + advance clock → assert delivery. */
  scheduleDelayedReminder(input: {
    phone: string;
    text: string;
    delayMs: number;
  }): Promise<{ delivered: boolean; outboxDepthAfter: number }>;

  /** Nack + requeue N times, then succeed — captures deliveryCount. */
  processRetryPolicy(input: { failuresBeforeSuccess: number }): Promise<RetryOutcome>;

  /**
   * Assert a quorum queue survives the loss of the named node — mock uses
   * `assertQuorumHealthy` with `minReplicas=2`; the real adapter uses the
   * management API to inspect quorum membership after `rabbitmqctl stop_app`
   * (real path unavailable in the v1.11-3 scope; returns a `NOT_IMPLEMENTED`
   * trace when the env var is set but the management call fails).
   */
  verifyQuorumSurvival(input: { failNodeId: string }): Promise<{ survived: boolean }>;

  /** Federation upstream ingest — records how the message landed downstream. */
  ingestFromFederationUpstream(input: {
    upstreamName: string;
    exchange: string;
    routingKey: string;
    body: unknown;
  }): Promise<FederationIngestResult>;

  /** Simulate amqp-connection-manager exponential backoff reconnect. */
  simulateReconnect(input: { failAttempts: number }): Promise<AutoReconnectOutcome>;

  reset(): Promise<void>;
}
