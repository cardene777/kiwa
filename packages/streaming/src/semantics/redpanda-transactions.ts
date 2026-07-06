// Redpanda transactions semantics — TxnCoordinator + producer id + epoch
// fencing, plus a partition-level "producer state" record that models how
// the Redpanda broker tracks in-flight transactions per producer.
//
// Modeled after the Redpanda `cluster::tx_gateway` implementation which
// mirrors Kafka's transaction coordinator with a few Redpanda-specific
// touches: per-partition producer state, epoch tied to term (a Raft
// abstraction we squash to a monotonic integer), and short-circuited abort
// on epoch mismatch.

export const REDPANDA_TRANSACTIONS_SYMBOL = Symbol.for('kiwa.streaming.semantics.redpanda-transactions');

export interface RedpandaTransactionsConfig {
  /** Transaction timeout after which the coordinator auto-aborts. Default 60_000ms. */
  readonly transactionTimeoutMs?: number;
}

export interface ProducerEpoch {
  readonly producerId: number;
  readonly epoch: number;
  readonly transactionalId?: string;
}

export type TxnPhase =
  | 'idle'
  | 'ongoing'
  | 'prepareCommit'
  | 'prepareAbort'
  | 'committed'
  | 'aborted';

export interface TxnRecord {
  readonly transactionalId: string;
  readonly producer: ProducerEpoch;
  phase: TxnPhase;
  readonly openedAt: number;
  readonly participatingPartitions: Set<string>;
}

export interface RedpandaTransactions {
  readonly [REDPANDA_TRANSACTIONS_SYMBOL]: true;
  readonly config: Required<RedpandaTransactionsConfig>;

  /** InitTransactions equivalent — assign producer id + starting epoch. */
  initTransactions(transactionalId: string): ProducerEpoch;

  /**
   * Bump the epoch when a new client with the same transactionalId connects.
   * The old epoch is fenced — subsequent writes with it get InvalidProducerEpoch.
   */
  bumpEpoch(transactionalId: string): ProducerEpoch;

  /** Open a new transaction for the given producer. */
  beginTransaction(transactionalId: string, producer: ProducerEpoch): void;

  /** Register a partition that will receive writes inside the open transaction. */
  addPartition(transactionalId: string, topic: string, partition: number): void;

  /** Commit — moves phase idle → prepareCommit → committed. */
  commitTransaction(transactionalId: string): void;

  /** Abort — moves phase ongoing → prepareAbort → aborted, or short-circuits on fence. */
  abortTransaction(transactionalId: string, reason?: string): void;

  /** Auto-abort any transactions that have exceeded `transactionTimeoutMs`. */
  expireStale(now: number): readonly string[];

  currentPhase(transactionalId: string): TxnPhase;
  currentProducer(transactionalId: string): ProducerEpoch | null;

  /** Guard: throw InvalidProducerEpoch if `provided` is older than the current. */
  guardEpoch(transactionalId: string, provided: ProducerEpoch): void;

  reset(): void;
}

/**
 * Create the Redpanda transaction coordinator model. Fencing is enforced via
 * `guardEpoch(transactionalId, providedEpoch)` — the same call the broker uses
 * to reject stale producers when the same `transactional.id` re-registers.
 */
export function createRedpandaTransactions(
  config?: RedpandaTransactionsConfig,
): RedpandaTransactions {
  const cfg: Required<RedpandaTransactionsConfig> = {
    transactionTimeoutMs: config?.transactionTimeoutMs ?? 60_000,
  };

  const producers = new Map<string, ProducerEpoch>();
  const transactions = new Map<string, TxnRecord>();
  let nextProducerId = 5000;

  function ensureProducer(transactionalId: string): ProducerEpoch {
    const existing = producers.get(transactionalId);
    if (existing) return existing;
    const producer: ProducerEpoch = {
      producerId: nextProducerId++,
      epoch: 0,
      transactionalId,
    };
    producers.set(transactionalId, producer);
    return producer;
  }

  const txns: RedpandaTransactions = {
    [REDPANDA_TRANSACTIONS_SYMBOL]: true,
    config: cfg,
    initTransactions(transactionalId: string): ProducerEpoch {
      return ensureProducer(transactionalId);
    },
    bumpEpoch(transactionalId: string): ProducerEpoch {
      const current = ensureProducer(transactionalId);
      const bumped: ProducerEpoch = {
        producerId: current.producerId,
        epoch: current.epoch + 1,
        transactionalId,
      };
      producers.set(transactionalId, bumped);
      // If a txn was open under the old epoch, fence it.
      const openTxn = transactions.get(transactionalId);
      if (openTxn && openTxn.phase !== 'committed' && openTxn.phase !== 'aborted') {
        openTxn.phase = 'aborted';
      }
      return bumped;
    },
    beginTransaction(transactionalId: string, producer: ProducerEpoch): void {
      txns.guardEpoch(transactionalId, producer);
      const openTxn = transactions.get(transactionalId);
      if (openTxn && openTxn.phase === 'ongoing') {
        throw new Error(`redpanda transactions: transaction already ongoing for "${transactionalId}"`);
      }
      transactions.set(transactionalId, {
        transactionalId,
        producer,
        phase: 'ongoing',
        openedAt: Date.now(),
        participatingPartitions: new Set(),
      });
    },
    addPartition(transactionalId: string, topic: string, partition: number): void {
      const txn = transactions.get(transactionalId);
      if (!txn) throw new Error(`redpanda transactions: no open transaction for "${transactionalId}"`);
      if (txn.phase !== 'ongoing') {
        throw new Error(`redpanda transactions: cannot add partition in phase=${txn.phase}`);
      }
      txn.participatingPartitions.add(`${topic}::${partition}`);
    },
    commitTransaction(transactionalId: string): void {
      const txn = transactions.get(transactionalId);
      if (!txn) throw new Error(`redpanda transactions: no open transaction for "${transactionalId}"`);
      if (txn.phase !== 'ongoing') {
        throw new Error(`redpanda transactions: cannot commit in phase=${txn.phase}`);
      }
      txn.phase = 'prepareCommit';
      txn.phase = 'committed';
    },
    abortTransaction(transactionalId: string): void {
      const txn = transactions.get(transactionalId);
      if (!txn) throw new Error(`redpanda transactions: no open transaction for "${transactionalId}"`);
      if (txn.phase === 'committed' || txn.phase === 'aborted') return;
      txn.phase = 'prepareAbort';
      txn.phase = 'aborted';
    },
    expireStale(now: number): readonly string[] {
      const expired: string[] = [];
      for (const [id, txn] of transactions) {
        if (txn.phase === 'ongoing' && now - txn.openedAt > cfg.transactionTimeoutMs) {
          txn.phase = 'aborted';
          expired.push(id);
        }
      }
      return expired;
    },
    currentPhase(transactionalId: string): TxnPhase {
      return transactions.get(transactionalId)?.phase ?? 'idle';
    },
    currentProducer(transactionalId: string): ProducerEpoch | null {
      return producers.get(transactionalId) ?? null;
    },
    guardEpoch(transactionalId: string, provided: ProducerEpoch): void {
      const current = producers.get(transactionalId);
      if (!current) {
        throw new Error(`redpanda transactions: unknown transactionalId "${transactionalId}"`);
      }
      if (provided.producerId !== current.producerId) {
        throw new Error(
          `redpanda transactions: producer id mismatch — got ${provided.producerId}, current ${current.producerId}`,
        );
      }
      if (provided.epoch !== current.epoch) {
        throw new Error(
          `redpanda transactions: InvalidProducerEpoch — got ${provided.epoch}, current ${current.epoch}`,
        );
      }
    },
    reset(): void {
      producers.clear();
      transactions.clear();
      nextProducerId = 5000;
    },
  };
  return txns;
}

/** Type guard: recognize a RedpandaTransactions instance. */
export function isRedpandaTransactions(value: unknown): value is RedpandaTransactions {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [REDPANDA_TRANSACTIONS_SYMBOL]?: true })[REDPANDA_TRANSACTIONS_SYMBOL] === true
  );
}
