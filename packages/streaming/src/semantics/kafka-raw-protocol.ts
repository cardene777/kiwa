// Kafka raw-protocol semantics — KIP-98 idempotent producer + transaction
// coordinator + fetch session + in-sync replica (ISR) tracker, packaged as a
// test-side model so kiwa tests can assert against wire-level behavior
// without spinning up a real broker.
//
// Scope on purpose:
//   - producer id / epoch fencing (KIP-98)
//   - transaction coordinator state machine (Ongoing / PrepareCommit /
//     CompleteCommit / PrepareAbort / CompleteAbort / Empty)
//   - fetch session id + incremental fetch epoch (KIP-227)
//   - ISR set + high-watermark advance rules
//
// Out of scope: SASL / SSL, controller failover, tiered storage.

export const KAFKA_RAW_PROTOCOL_SYMBOL = Symbol.for('kiwa.streaming.semantics.kafka-raw-protocol');

export interface KafkaRawProtocolConfig {
  /** How many replicas a partition has. Default 3, matches broker.default. */
  readonly replicationFactor?: number;
  /** min.insync.replicas — commit gate. Default 2. */
  readonly minInSyncReplicas?: number;
}

export type TransactionCoordinatorState =
  | 'Empty'
  | 'Ongoing'
  | 'PrepareCommit'
  | 'CompleteCommit'
  | 'PrepareAbort'
  | 'CompleteAbort';

export interface ProducerIdentity {
  readonly producerId: number;
  readonly epoch: number;
}

export interface FetchSession {
  readonly sessionId: number;
  epoch: number;
}

export interface KafkaRawProtocol {
  readonly [KAFKA_RAW_PROTOCOL_SYMBOL]: true;
  readonly config: Required<KafkaRawProtocolConfig>;

  /** InitProducerId — assigns a fresh (producerId, epoch=0) pair. */
  initProducerId(): ProducerIdentity;

  /**
   * Fence a producer identity — bumps the current epoch, which causes any
   * older-epoch send to be rejected as `INVALID_PRODUCER_EPOCH`. Matches the
   * KIP-98 fencing rule that a coordinator re-init bumps epoch.
   */
  fenceProducer(producerId: number): ProducerIdentity;

  /** Return true if (producerId, epoch) is still the latest identity. */
  isValidEpoch(identity: ProducerIdentity): boolean;

  /** Transition the transaction coordinator state machine. Rejects invalid transitions. */
  transitionTransaction(from: TransactionCoordinatorState, to: TransactionCoordinatorState): void;

  /** Current transaction coordinator state. */
  transactionState(): TransactionCoordinatorState;

  /** Open a new incremental fetch session (KIP-227). */
  openFetchSession(): FetchSession;

  /** Advance a fetch session epoch and return the current one. Throws on stale sessions. */
  bumpFetchSession(sessionId: number): number;

  /** Add a broker id to the ISR set for the given topic-partition. */
  addToIsr(topic: string, partition: number, brokerId: number): void;

  /** Remove a broker id from the ISR set (lag / heartbeat timeout). */
  removeFromIsr(topic: string, partition: number, brokerId: number): void;

  /** Current ISR set for a topic-partition. */
  getIsr(topic: string, partition: number): readonly number[];

  /**
   * Try to advance the high-watermark to `nextOffset`. Only succeeds when the
   * ISR set size >= `minInSyncReplicas`. Returns the resulting HW.
   */
  advanceHighWatermark(topic: string, partition: number, nextOffset: number): number;

  /** Current high watermark for a topic-partition. */
  getHighWatermark(topic: string, partition: number): number;

  /** Reset all state — useful between test cases. */
  reset(): void;
}

interface TxnEdge {
  readonly from: TransactionCoordinatorState;
  readonly to: TransactionCoordinatorState;
}

// Valid transitions modeled after the KIP-98 spec (KafkaApis txn state machine).
const VALID_TXN_TRANSITIONS: readonly TxnEdge[] = [
  { from: 'Empty', to: 'Ongoing' },
  { from: 'Ongoing', to: 'PrepareCommit' },
  { from: 'Ongoing', to: 'PrepareAbort' },
  { from: 'PrepareCommit', to: 'CompleteCommit' },
  { from: 'PrepareAbort', to: 'CompleteAbort' },
  { from: 'CompleteCommit', to: 'Empty' },
  { from: 'CompleteAbort', to: 'Empty' },
];

/**
 * Create a Kafka raw-protocol semantics model. Exposes the pieces of the wire
 * protocol that show up in exactly-once tests: producer id + epoch, txn
 * coordinator state, incremental fetch sessions, and ISR + high-watermark.
 */
export function createKafkaRawProtocol(config?: KafkaRawProtocolConfig): KafkaRawProtocol {
  const cfg: Required<KafkaRawProtocolConfig> = {
    replicationFactor: config?.replicationFactor ?? 3,
    minInSyncReplicas: config?.minInSyncReplicas ?? 2,
  };

  let nextProducerId = 1000;
  const producerEpochs = new Map<number, number>();
  let txnState: TransactionCoordinatorState = 'Empty';
  let nextFetchSessionId = 1;
  const fetchSessions = new Map<number, FetchSession>();
  // Composite key `${topic}::${partition}` → ISR set.
  const isr = new Map<string, Set<number>>();
  const highWatermarks = new Map<string, number>();

  function tpKey(topic: string, partition: number): string {
    return `${topic}::${partition}`;
  }

  const protocol: KafkaRawProtocol = {
    [KAFKA_RAW_PROTOCOL_SYMBOL]: true,
    config: cfg,
    initProducerId(): ProducerIdentity {
      const producerId = nextProducerId++;
      producerEpochs.set(producerId, 0);
      return { producerId, epoch: 0 };
    },
    fenceProducer(producerId: number): ProducerIdentity {
      const current = producerEpochs.get(producerId);
      if (current === undefined) {
        throw new Error(`kafka raw-protocol: unknown producer id ${producerId}`);
      }
      const next = current + 1;
      producerEpochs.set(producerId, next);
      return { producerId, epoch: next };
    },
    isValidEpoch(identity: ProducerIdentity): boolean {
      const current = producerEpochs.get(identity.producerId);
      return current !== undefined && current === identity.epoch;
    },
    transitionTransaction(from: TransactionCoordinatorState, to: TransactionCoordinatorState): void {
      if (txnState !== from) {
        throw new Error(
          `kafka raw-protocol: txn state mismatch — current=${txnState}, requested from=${from}`,
        );
      }
      const allowed = VALID_TXN_TRANSITIONS.some((e) => e.from === from && e.to === to);
      if (!allowed) {
        throw new Error(`kafka raw-protocol: invalid txn transition ${from} -> ${to}`);
      }
      txnState = to;
    },
    transactionState(): TransactionCoordinatorState {
      return txnState;
    },
    openFetchSession(): FetchSession {
      const sessionId = nextFetchSessionId++;
      const session: FetchSession = { sessionId, epoch: 0 };
      fetchSessions.set(sessionId, session);
      return session;
    },
    bumpFetchSession(sessionId: number): number {
      const session = fetchSessions.get(sessionId);
      if (!session) {
        throw new Error(`kafka raw-protocol: fetch session ${sessionId} not open`);
      }
      session.epoch += 1;
      return session.epoch;
    },
    addToIsr(topic: string, partition: number, brokerId: number): void {
      const key = tpKey(topic, partition);
      const set = isr.get(key) ?? new Set<number>();
      if (set.size >= cfg.replicationFactor) {
        throw new Error(
          `kafka raw-protocol: ISR size cannot exceed replicationFactor=${cfg.replicationFactor}`,
        );
      }
      set.add(brokerId);
      isr.set(key, set);
    },
    removeFromIsr(topic: string, partition: number, brokerId: number): void {
      const key = tpKey(topic, partition);
      const set = isr.get(key);
      if (!set) return;
      set.delete(brokerId);
    },
    getIsr(topic: string, partition: number): readonly number[] {
      const key = tpKey(topic, partition);
      const set = isr.get(key);
      if (!set) return [];
      return [...set].sort((a, b) => a - b);
    },
    advanceHighWatermark(topic: string, partition: number, nextOffset: number): number {
      const key = tpKey(topic, partition);
      const isrSet = isr.get(key) ?? new Set<number>();
      const current = highWatermarks.get(key) ?? 0;
      if (isrSet.size < cfg.minInSyncReplicas) {
        // Not enough replicas — HW cannot advance. Stays at current.
        return current;
      }
      if (nextOffset <= current) return current;
      highWatermarks.set(key, nextOffset);
      return nextOffset;
    },
    getHighWatermark(topic: string, partition: number): number {
      return highWatermarks.get(tpKey(topic, partition)) ?? 0;
    },
    reset(): void {
      nextProducerId = 1000;
      producerEpochs.clear();
      txnState = 'Empty';
      nextFetchSessionId = 1;
      fetchSessions.clear();
      isr.clear();
      highWatermarks.clear();
    },
  };
  return protocol;
}

/** Type guard: recognize a KafkaRawProtocol. */
export function isKafkaRawProtocol(value: unknown): value is KafkaRawProtocol {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [KAFKA_RAW_PROTOCOL_SYMBOL]?: true })[KAFKA_RAW_PROTOCOL_SYMBOL] === true
  );
}
