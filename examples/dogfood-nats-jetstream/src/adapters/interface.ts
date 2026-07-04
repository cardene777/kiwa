/**
 * Provider-neutral NATS JetStream + KV + Object + routing adapter contract
 * for the dogfood-nats-jetstream dogfood.
 *
 * The dogfood talks to NATS only through this interface. Two
 * implementations exist: {@link makeMockAdapter} (backed by
 * `@kiwa-test/streaming`'s NatsMock + JetStream + KV + Object Store) and
 * {@link makeRealAdapter} (probes a live NATS via `NATS_URL`; env-skip
 * variant otherwise).
 *
 * All ops satisfy the same 5-op surface so behavioural fidelity between
 * real vs mock can be measured side-by-side and fed to
 * `@kiwa-test/quality-metrics` 7-axis release gate.
 */

/** Sample OrderEvent payload the dogfood publishes onto JetStream. */
export interface OrderEvent {
  readonly orderId: string;
  readonly userId: string;
  readonly total: number;
  readonly currency: 'USD' | 'JPY' | 'EUR';
}

/** Sample user profile the dogfood stores in KV. */
export interface UserProfile {
  readonly userId: string;
  readonly displayName: string;
  readonly region: string;
}

/** JetStream step observation — persist + consume + ack + redelivery. */
export interface JetStreamObservation {
  readonly stream: string;
  readonly publishedSeqs: readonly number[];
  readonly consumedCount: number;
  readonly ackedCount: number;
  readonly redeliveredCount: number;
  readonly filterSubject: string;
}

/** KV step observation — put + get + delete + revision bookkeeping. */
export interface KVObservation {
  readonly bucket: string;
  readonly puts: number;
  readonly updates: number;
  readonly deletes: number;
  readonly lastRevision: number;
  readonly finalKeys: readonly string[];
}

/** Object Store step observation — put + list + digest + total bytes. */
export interface ObjectObservation {
  readonly bucket: string;
  readonly objectsPut: number;
  readonly totalBytesStored: number;
  readonly digests: readonly string[];
  readonly deletedNames: readonly string[];
}

/** Routing step observation — literal + wildcard + queue group counts. */
export interface RoutingObservation {
  readonly literalDeliveries: number;
  readonly wildcardDeliveries: number;
  readonly catchAllDeliveries: number;
  readonly queueGroupDeliveries: number;
  readonly queueGroupSize: number;
}

/** Trace event — every adapter op appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Provider-neutral NATS driver. 5 ops map to the AC in Issue #830 — 1
 * per JetStream / KV / Object / Routing pattern, plus a fidelity emission
 * op.
 */
export interface NatsJetStreamAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveJetStream(events: readonly OrderEvent[]): Promise<JetStreamObservation>;

  driveKV(profiles: readonly UserProfile[]): Promise<KVObservation>;

  driveObject(): Promise<ObjectObservation>;

  driveRouting(): Promise<RoutingObservation>;

  emitFidelity(): Promise<void>;

  metrics(): {
    latencySamplesMs: number[];
    jetstreamPublished: number;
    jetstreamAcked: number;
    kvOperations: number;
    objectBytesStored: number;
    routingDeliveries: number;
  };

  reset(): Promise<void>;
}

export const OPS_UNDER_TEST: readonly string[] = [
  'driveJetStream',
  'driveKV',
  'driveObject',
  'driveRouting',
  'emitFidelity',
];
