// Fidelity harness — 3 (provider) × 8 (axis) grid describing which provider
// covers which advanced-semantics axis, and whether the mock has behavior
// parity ("fidelity") with the corresponding real driver. Tests iterate the
// grid to assert every cell is either implemented or explicitly marked as
// "not applicable" for that provider.

import type { StreamingProvider } from '../types.js';

export const FIDELITY_HARNESS_SYMBOL = Symbol.for('kiwa.streaming.semantics.fidelity-harness');

export type SemanticsAxis =
  | 'kafka-raw-protocol'
  | 'kafka-consumer-group'
  | 'redpanda-schema-evolution'
  | 'redpanda-transactions'
  | 'nats-jetstream-durable'
  | 'nats-kv-object'
  | 'exactly-once'
  | 'consumer-lag-telemetry';

export type CellStatus = 'implemented' | 'not-applicable' | 'planned';

export interface FidelityCell {
  readonly provider: StreamingProvider;
  readonly axis: SemanticsAxis;
  readonly status: CellStatus;
  readonly note?: string;
}

export interface FidelityHarness {
  readonly [FIDELITY_HARNESS_SYMBOL]: true;
  readonly cells: readonly FidelityCell[];
  cellFor(provider: StreamingProvider, axis: SemanticsAxis): FidelityCell | null;
  cellsFor(provider: StreamingProvider): readonly FidelityCell[];
  axesFor(provider: StreamingProvider, status: CellStatus): readonly SemanticsAxis[];
  totalCells(): number;
}

const AXES: readonly SemanticsAxis[] = [
  'kafka-raw-protocol',
  'kafka-consumer-group',
  'redpanda-schema-evolution',
  'redpanda-transactions',
  'nats-jetstream-durable',
  'nats-kv-object',
  'exactly-once',
  'consumer-lag-telemetry',
];

const PROVIDERS: readonly StreamingProvider[] = ['kafka', 'redpanda', 'nats'];

/**
 * Default grid — Kafka + Redpanda cover the Kafka-shaped axes (raw protocol,
 * consumer group, schema evolution, transactions, exactly-once, lag).
 * NATS covers the JetStream + KV/Object axes + shares exactly-once + lag.
 * `not-applicable` marks a real-world mismatch (e.g. NATS has no raw Kafka
 * wire protocol) so tests can distinguish "missing on purpose" from "todo".
 */
export function createFidelityHarness(): FidelityHarness {
  const cells: FidelityCell[] = [];
  for (const provider of PROVIDERS) {
    for (const axis of AXES) {
      cells.push({ provider, axis, ...deriveStatus(provider, axis) });
    }
  }
  const harness: FidelityHarness = {
    [FIDELITY_HARNESS_SYMBOL]: true,
    cells,
    cellFor(provider, axis) {
      return cells.find((c) => c.provider === provider && c.axis === axis) ?? null;
    },
    cellsFor(provider) {
      return cells.filter((c) => c.provider === provider);
    },
    axesFor(provider, status) {
      return cells.filter((c) => c.provider === provider && c.status === status).map((c) => c.axis);
    },
    totalCells() {
      return cells.length;
    },
  };
  return harness;
}

function deriveStatus(
  provider: StreamingProvider,
  axis: SemanticsAxis,
): Pick<FidelityCell, 'status' | 'note'> {
  if (axis === 'kafka-raw-protocol') {
    if (provider === 'nats') return { status: 'not-applicable', note: 'NATS has no Kafka wire protocol' };
    return { status: 'implemented' };
  }
  if (axis === 'kafka-consumer-group') {
    if (provider === 'nats') return { status: 'not-applicable', note: 'NATS uses queue groups, modeled via JetStream durable' };
    return { status: 'implemented' };
  }
  if (axis === 'redpanda-schema-evolution') {
    if (provider === 'nats') return { status: 'not-applicable', note: 'no schema registry on NATS' };
    return { status: 'implemented' };
  }
  if (axis === 'redpanda-transactions') {
    if (provider === 'nats') return { status: 'not-applicable', note: 'NATS has no Redpanda TxnCoordinator' };
    return { status: 'implemented' };
  }
  if (axis === 'nats-jetstream-durable') {
    if (provider !== 'nats') return { status: 'not-applicable', note: 'JetStream is NATS-specific' };
    return { status: 'implemented' };
  }
  if (axis === 'nats-kv-object') {
    if (provider !== 'nats') return { status: 'not-applicable', note: 'KV / Object store are JetStream-layered NATS features' };
    return { status: 'implemented' };
  }
  if (axis === 'exactly-once' || axis === 'consumer-lag-telemetry') {
    // Cross-provider — implemented for all 3.
    return { status: 'implemented' };
  }
  return { status: 'planned' };
}

/** Type guard: recognize a FidelityHarness. */
export function isFidelityHarness(value: unknown): value is FidelityHarness {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [FIDELITY_HARNESS_SYMBOL]?: true })[FIDELITY_HARNESS_SYMBOL] === true
  );
}

/** Env-gate — returns whether tests should also run the real driver against KIWA_MODE=real. */
export function isRealDriverMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.KIWA_MODE === 'real';
}

/**
 * Which real-driver key an axis requires when KIWA_MODE=real is set. Tests
 * check `requiredKeyFor(cell.axis)` and skip the real-driver assertion when
 * the corresponding env var isn't present.
 */
export function requiredKeyFor(axis: SemanticsAxis): string | null {
  if (axis === 'kafka-raw-protocol' || axis === 'kafka-consumer-group') return 'KAFKA_KEY';
  if (axis === 'redpanda-schema-evolution' || axis === 'redpanda-transactions') return 'REDPANDA_KEY';
  if (axis === 'nats-jetstream-durable' || axis === 'nats-kv-object') return 'NATS_KEY';
  return null;
}
