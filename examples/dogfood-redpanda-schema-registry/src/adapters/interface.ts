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
 * v1 (v1.20-3) covered 5 ops — register / evolution / compat-3-modes /
 * publish / emitFidelity. v1.31-3 extends the adapter with 4 v2 ops that
 * exercise the streaming v0.3 advanced Schema Registry semantics end-to-end:
 *
 *   - `driveEvolutionTransitive`  — walk BACKWARD_TRANSITIVE +
 *                                    FORWARD_TRANSITIVE chains (v1 → v2 →
 *                                    v3) so the mock enforces the transitive
 *                                    variant (every prior version rechecked)
 *                                    rather than the immediate-neighbour
 *                                    variant.
 *   - `driveSubjectStrategies`    — probe `topic-name` +
 *                                    `record-name` + `topic-record-name`
 *                                    strategies on the same schema shape and
 *                                    report the derived subject per strategy.
 *   - `driveConsoleAdmin`         — hit the Redpanda Console admin API
 *                                    surface (`/api/subjects` +
 *                                    `/api/config/{subject}` +
 *                                    `/api/schemas/ids/{id}` +
 *                                    `/api/health`) via a small HTTP client.
 *                                    Mock mode replays deterministic
 *                                    fixtures; real mode hits the running
 *                                    Console container / URL.
 *   - `driveTestcontainersProbe`  — probe the Redpanda + Console
 *                                    testcontainers pair (Redpanda v23+ +
 *                                    console v2.x images), reporting the
 *                                    container-mapped host:port pairs when
 *                                    `KIWA_MODE=real` + `REDPANDA_KEY` are
 *                                    set, else the deterministic mock
 *                                    placeholders.
 *
 * All 9 ops (5 v1 + 4 v2) satisfy the same "op → observation → trace"
 * shape so behavioural fidelity between real vs mock can be measured side-by-
 * side and fed to `@kiwa-test/quality-metrics` 13-axis release gate.
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

// -----------------------------------------------------------------------------
// v2 (v1.31-3) — transitive evolution + subject strategies + Console API +
// testcontainers probe observations.
// -----------------------------------------------------------------------------

/**
 * Transitive evolution step observation — record whether a v1 → v2 → v3
 * chain succeeds under BACKWARD_TRANSITIVE vs BACKWARD (mock enforces the
 * transitive variant by rechecking every prior version rather than only the
 * immediate neighbour). The mock's structural check is intentionally
 * conservative — the transitive mode also rejects a schema that is
 * BACKWARD-compat with v2 but not v1.
 */
export interface TransitiveEvolutionObservation {
  readonly subject: string;
  readonly versionsAccepted: number;
  readonly transitiveMode: 'BACKWARD_TRANSITIVE' | 'FORWARD_TRANSITIVE';
  /** True when the transitive check rejected a change that BACKWARD accepted. */
  readonly rejectedTransitiveOnly: boolean;
  /** Full compatibility chain verdicts across the immediate neighbours. */
  readonly chainVerdicts: readonly {
    readonly from: number;
    readonly to: number;
    readonly compatible: boolean;
  }[];
}

/**
 * Subject strategy observation — one row per subject-naming strategy
 * exercised against the same topic + record. Reports the derived subject +
 * whether the strategy roundtrips a register + latest fetch.
 */
export interface SubjectStrategyObservation {
  readonly probed: readonly {
    readonly strategy: 'topic-name' | 'record-name' | 'topic-record-name';
    readonly derivedSubject: string;
    readonly registered: boolean;
    readonly latestVersion: number;
  }[];
}

/**
 * Redpanda Console admin API observation — records the endpoints hit + the
 * verdict returned. Mock mode replays deterministic fixtures; real mode hits
 * the running Console container / URL.
 */
export interface ConsoleAdminObservation {
  readonly baseUrl: string;
  /** Records the endpoints exercised + the http status observed. */
  readonly endpoints: readonly {
    readonly path: string;
    readonly status: number;
    readonly ok: boolean;
  }[];
  /** Health probe result — `ok` when the health endpoint returned 200. */
  readonly healthOk: boolean;
  readonly subjectsSeen: number;
  readonly schemaByIdReachable: boolean;
}

/**
 * Testcontainers probe observation — mirrors the Kafka sibling contract
 * (bootstrap + admin URL + image tags + reachable flag) so the fidelity
 * harness treats both adapters uniformly.
 */
export interface TestcontainersProbeObservation {
  readonly bootstrap: string;
  readonly consoleUrl: string;
  readonly schemaRegistryUrl: string;
  readonly redpandaImage: string;
  readonly consoleImage: string;
  readonly reachable: boolean;
}

/**
 * Provider-neutral Redpanda + schema-registry driver. 5 v1 ops + 4 v2 ops
 * map to the AC in Issue #1011 (schema evolution + BACKWARD/FORWARD/FULL
 * compatibility + Redpanda Console API + testcontainers pair + Playwright
 * e2e + release gate 13 軸).
 */
export interface RedpandaSchemaRegistryAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveRegister(): Promise<RegisterObservation>;

  driveEvolution(): Promise<EvolutionObservation>;

  driveCompatibilityModes(): Promise<CompatibilityObservation>;

  drivePublish(payloads: readonly UserPayload[]): Promise<PublishObservation>;

  emitFidelity(): Promise<void>;

  // ---------------------------------------------------------------------------
  // v2 ops — advanced Schema Registry semantics + Console admin + testcontainers
  // probe. Each op is scope-boxed so the real driver can report a
  // well-defined divergence when the env is absent.
  // ---------------------------------------------------------------------------

  /**
   * v2 — register a v1 → v2 → v3 chain under BACKWARD_TRANSITIVE +
   * FORWARD_TRANSITIVE, then attempt a change that BACKWARD would accept but
   * BACKWARD_TRANSITIVE must reject (an added-required-field vs v1 with a
   * default vs v2). Reports the chain verdicts + the transitive-only reject.
   */
  driveEvolutionTransitive(): Promise<TransitiveEvolutionObservation>;

  /**
   * v2 — probe topic-name + record-name + topic-record-name strategies on
   * the same topic + record. Reports the derived subject per strategy so
   * consumers can verify the naming convention wire-up.
   */
  driveSubjectStrategies(): Promise<SubjectStrategyObservation>;

  /**
   * v2 — walk the Redpanda Console admin API surface (subjects list +
   * subject config + schema by id + health). Mock mode returns deterministic
   * fixtures; real mode hits the container-mapped URL.
   */
  driveConsoleAdmin(): Promise<ConsoleAdminObservation>;

  /**
   * v2 — probe the Redpanda + Console testcontainers pair (Redpanda v23+ +
   * console v2.x). Under mock mode returns deterministic placeholders; under
   * real mode returns the container-mapped host:port pairs or a well-defined
   * divergence when the env is absent.
   */
  driveTestcontainersProbe(): Promise<TestcontainersProbeObservation>;

  metrics(): {
    latencySamplesMs: number[];
    subjectsRegistered: number;
    recordsPublished: number;
    compatibilityRejections: number;
    evolutionSteps: number;
    // v2 counters — the fidelity report surfaces these next to the v1 counters.
    transitiveChainSteps: number;
    subjectStrategyProbes: number;
    consoleAdminCalls: number;
    testcontainersProbes: number;
  };

  reset(): Promise<void>;
}

export const OPS_UNDER_TEST: readonly string[] = [
  'driveRegister',
  'driveEvolution',
  'driveCompatibilityModes',
  'drivePublish',
  'emitFidelity',
  // v2 ops — advance the surface from 5 → 9 while keeping the v1 ops in place.
  'driveEvolutionTransitive',
  'driveSubjectStrategies',
  'driveConsoleAdmin',
  'driveTestcontainersProbe',
];
