/**
 * Provider-neutral Redpanda + Schema Registry adapter contract for the
 * dogfood-redpanda-schema-registry dogfood.
 *
 * The dogfood talks to Redpanda + Confluent SR only through this interface.
 * Two implementations exist: {@link makeMockAdapter} (backed by
 * `@kiwa-test/streaming`'s RedpandaMock + SchemaRegistry) and
 * {@link makeRealAdapter} (probes a live Redpanda broker via
 * `REDPANDA_BOOTSTRAP` + Confluent SR via `SCHEMA_REGISTRY_URL`; env-skip
 * variant otherwise).
 *
 * All ops satisfy the same 5-op surface so behavioural fidelity between
 * real vs mock can be measured side-by-side and fed to
 * `@kiwa-test/quality-metrics` 7-axis release gate.
 */

import type { CompatibilityMode } from '@kiwa-test/streaming';

/** Sample User payload the dogfood publishes. */
export interface UserPayload {
  readonly id: string;
  readonly displayName: string;
  readonly region: string;
  readonly email?: string | null;
}

/** Sample Order payload the dogfood publishes. */
export interface OrderPayload {
  readonly orderId: string;
  readonly userId: string;
  readonly total: number;
}

/** Registration step observation — how many subjects, ids, versions. */
export interface RegisterObservation {
  readonly subjects: readonly string[];
  readonly registeredIds: readonly number[];
  readonly latestVersions: Record<string, number>;
}

/** Evolution step observation — v1 + v2 versions + BACKWARD compat verdict. */
export interface EvolutionObservation {
  readonly subject: string;
  readonly v1Id: number;
  readonly v2Id: number;
  readonly compatibleV2: boolean;
  readonly rejectedIncompatible: boolean;
}

/**
 * Compatibility check step observation — one entry per mode probed
 * (BACKWARD / FORWARD / FULL) with the mock's verdict for the same schema
 * change.
 */
export interface CompatibilityObservation {
  readonly probed: readonly {
    readonly subject: string;
    readonly mode: CompatibilityMode;
    readonly compatible: boolean;
    readonly reasons: readonly string[];
  }[];
}

/** Publish step observation — records published + producer rejects. */
export interface PublishObservation {
  readonly recordsPublished: number;
  readonly rejectedByCompatibility: number;
}

/** Trace event — every adapter op appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Provider-neutral Redpanda + schema-registry driver. 5 ops map to the AC
 * in Issue #829 (register 3 Avro schemas + evolve User + probe 3 compat
 * modes + publish with fail-fast + emit fidelity report).
 */
export interface RedpandaSchemaRegistryAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveRegister(): Promise<RegisterObservation>;

  driveEvolution(): Promise<EvolutionObservation>;

  driveCompatibilityModes(): Promise<CompatibilityObservation>;

  drivePublish(payloads: readonly UserPayload[]): Promise<PublishObservation>;

  emitFidelity(): Promise<void>;

  metrics(): {
    latencySamplesMs: number[];
    subjectsRegistered: number;
    recordsPublished: number;
    compatibilityRejections: number;
    evolutionSteps: number;
  };

  reset(): Promise<void>;
}

export const OPS_UNDER_TEST: readonly string[] = [
  'driveRegister',
  'driveEvolution',
  'driveCompatibilityModes',
  'drivePublish',
  'emitFidelity',
];
