/**
 * Real adapter — v1.31-2 promotes the v1.20-2 aliveness probe to a
 * confluent-kafka + Schema Registry testcontainers path (Kafka 3.7 image +
 * cp-schema-registry image, both duck-typed against the `testcontainers` npm
 * package so a missing peer dep degrades to `KAFKA_ENV_MISSING` instead of a
 * compile error).
 *
 * Two env-ready states are supported:
 *   1. `container` option supplied — the caller booted the containers through
 *      {@link startKafkaTestcontainers} (typically in a vitest `beforeAll` so
 *      one pair boots per test file) + hands the handle to the adapter.
 *      `driveTestcontainersProbe` reports the live host:port pair.
 *   2. `KIWA_MODE=real` + `KAFKA_KEY` populated — the caller has already
 *      provisioned Kafka + Schema Registry externally (docker-compose or a
 *      shared deployment). The adapter reports the endpoints from
 *      `KAFKA_BOOTSTRAP` + `KAFKA_SCHEMA_REGISTRY_URL`.
 *
 * v1.20-2 keeps `driveProducer` / `driveConsumerGroup` / `driveTransaction` /
 * `driveDlq` scope-boxed to `REAL_ADAPTER_NOT_IMPLEMENTED` under the real
 * adapter — the point is fidelity-harness bring-up + testcontainers probe,
 * not a production confluent-kafka client. That kafkajs binding is a
 * follow-up milestone; the fidelity harness records the divergence as a
 * well-defined `REAL_ADAPTER_NOT_IMPLEMENTED` gap.
 */

import type {
  ConsumerObservation,
  DlqObservation,
  IsrHighWatermarkObservation,
  KafkaEventPipelineAdapter,
  ProducerObservation,
  RawProtocolObservation,
  SchemaRegistryObservation,
  TestcontainersProbeObservation,
  TraceEvent,
  TransactionObservation,
} from './interface.js';
import {
  KAFKA_IMAGE_DEFAULT,
  MOCK_KAFKA_BOOTSTRAP,
  MOCK_SCHEMA_REGISTRY_URL,
  SCHEMA_REGISTRY_IMAGE_DEFAULT,
} from './mock.js';

/**
 * Error kind published on every rejected trace event when the environment
 * cannot reach a live Kafka broker. The fidelity harness matches this string
 * to skip real-column assertions without failing the suite.
 */
export const KAFKA_ENV_MISSING = 'KAFKA_ENV_MISSING';

/** Legacy alias — some tests still assert on `KAFKA_ENV_MISSING` verbatim. */
export const REAL_ADAPTER_NOT_IMPLEMENTED = 'REAL_ADAPTER_NOT_IMPLEMENTED';

export interface RealEnv {
  /**
   * Broker bootstrap string (host:port,host:port). Populated from
   * `KAFKA_BOOTSTRAP` when set, else falls back to the mock placeholder.
   */
  readonly bootstrap: string;
  /** Optional client id override — defaults to the dogfood app name. */
  readonly clientId: string;
  /**
   * Schema Registry URL — populated from `KAFKA_SCHEMA_REGISTRY_URL` when
   * set, else falls back to the mock placeholder.
   */
  readonly schemaRegistryUrl: string;
}

/**
 * Detect whether the environment is opted-in for real-mode drives. Requires
 * BOTH `KIWA_MODE=real` + `KAFKA_KEY` to be set. `KAFKA_KEY` is the
 * fidelity-harness opt-in signal (mirrors the payment / auth v2 examples).
 * `KAFKA_BOOTSTRAP` alone is not enough — we don't want CI-side accidental
 * container boots.
 */
export function detectRealEnv(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): RealEnv | null {
  if (env['KIWA_MODE'] !== 'real') return null;
  if (!env['KAFKA_KEY']) return null;
  const bootstrap = env['KAFKA_BOOTSTRAP'] ?? MOCK_KAFKA_BOOTSTRAP;
  const schemaRegistryUrl = env['KAFKA_SCHEMA_REGISTRY_URL'] ?? MOCK_SCHEMA_REGISTRY_URL;
  const clientId = env['KAFKA_CLIENT_ID'] ?? 'dogfood-kafka-event-pipeline';
  return { bootstrap, clientId, schemaRegistryUrl };
}

export class SkippedError extends Error {
  readonly code = KAFKA_ENV_MISSING;
  constructor(op: string) {
    super(`SkippedError: cannot execute ${op} because KIWA_MODE=real + KAFKA_KEY are not set`);
  }
}

/**
 * Handle returned by {@link startKafkaTestcontainers}. The handle exposes the
 * container-mapped host:port pair for both the Kafka broker + the Schema
 * Registry, and a `stop()` boundary the caller invokes in an `afterAll`.
 */
export interface KafkaTestcontainersHandle {
  /** Kafka broker bootstrap (`host:port`). */
  readonly bootstrap: string;
  /** Schema Registry URL (`http://host:port`). */
  readonly schemaRegistryUrl: string;
  /** Image tag of the running Kafka container. */
  readonly kafkaImage: string;
  /** Image tag of the running Schema Registry container. */
  readonly schemaRegistryImage: string;
  /** Free the containers. Idempotent. */
  stop(): Promise<void>;
}

/**
 * Duck-typed shape for the `testcontainers` module. The adapter never
 * type-couples to testcontainers so a missing peer dependency degrades to
 * the `KAFKA_ENV_MISSING` state instead of a compile error.
 *
 * Modeled after the oauth21-provider real adapter which pioneered the same
 * pattern.
 */
interface TestcontainersModule {
  GenericContainer: new (image: string) => TestcontainersContainer;
  Wait: {
    forHttp(path: string, port: number): TestcontainersWaitStrategy;
    forLogMessage(message: string | RegExp): TestcontainersWaitStrategy;
    forListeningPorts(): TestcontainersWaitStrategy;
  };
}

interface TestcontainersContainer {
  withExposedPorts(...ports: number[]): TestcontainersContainer;
  withEnvironment(env: Record<string, string>): TestcontainersContainer;
  withCommand(command: readonly string[]): TestcontainersContainer;
  withWaitStrategy(strategy: TestcontainersWaitStrategy): TestcontainersContainer;
  withStartupTimeout(ms: number): TestcontainersContainer;
  withNetworkMode(mode: string): TestcontainersContainer;
  start(): Promise<TestcontainersStartedContainer>;
}

interface TestcontainersWaitStrategy {
  withStartupTimeout(ms: number): TestcontainersWaitStrategy;
}

interface TestcontainersStartedContainer {
  getHost(): string;
  getMappedPort(port: number): number;
  stop(): Promise<void>;
}

/**
 * Options for {@link startKafkaTestcontainers}. Everything is optional —
 * defaults match the confluent-kafka 3.7 image pair.
 */
export interface StartKafkaTestcontainersOptions {
  /** Kafka image tag. Defaults to {@link KAFKA_IMAGE_DEFAULT}. */
  kafkaImage?: string;
  /** Schema Registry image tag. Defaults to {@link SCHEMA_REGISTRY_IMAGE_DEFAULT}. */
  schemaRegistryImage?: string;
  /** Startup timeout in milliseconds. Defaults to 90_000 (90s). */
  startupTimeoutMs?: number;
  /**
   * Optional override for the `testcontainers` module. Tests inject a duck-
   * typed fake so the adapter's boot path can be exercised without Docker.
   */
  testcontainersModule?: TestcontainersModule;
}

/**
 * Boot a Kafka broker + Schema Registry pair as testcontainers. The caller
 * owns the lifecycle — invoke `stop()` in an `afterAll` block to avoid
 * leaked containers.
 *
 * When the `testcontainers` package is missing at runtime the call throws a
 * `SkippedError` with `KAFKA_ENV_MISSING`; callers should catch it + record
 * the divergence via the adapter's trace log.
 */
export async function startKafkaTestcontainers(
  opts: StartKafkaTestcontainersOptions = {},
): Promise<KafkaTestcontainersHandle> {
  const kafkaImage = opts.kafkaImage ?? KAFKA_IMAGE_DEFAULT;
  const schemaRegistryImage = opts.schemaRegistryImage ?? SCHEMA_REGISTRY_IMAGE_DEFAULT;
  const startupTimeoutMs = opts.startupTimeoutMs ?? 90_000;

  let tc: TestcontainersModule;
  if (opts.testcontainersModule) {
    tc = opts.testcontainersModule;
  } else {
    try {
      // The peer dependency is soft — `testcontainers` is only required when
      // the caller actually boots containers.
      tc = (await import('testcontainers' as string)) as unknown as TestcontainersModule;
    } catch {
      throw new SkippedError('startKafkaTestcontainers');
    }
  }

  // Boot Kafka in KRaft single-node mode so we don't need Zookeeper.
  const kafka = await new tc.GenericContainer(kafkaImage)
    .withExposedPorts(9092, 9093)
    .withEnvironment({
      KAFKA_NODE_ID: '1',
      KAFKA_PROCESS_ROLES: 'broker,controller',
      KAFKA_CONTROLLER_QUORUM_VOTERS: '1@localhost:9093',
      KAFKA_LISTENERS: 'PLAINTEXT://:9092,CONTROLLER://:9093',
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://localhost:9092',
      KAFKA_CONTROLLER_LISTENER_NAMES: 'CONTROLLER',
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: 'PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT',
      KAFKA_INTER_BROKER_LISTENER_NAME: 'PLAINTEXT',
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true',
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: '1',
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: '1',
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: '1',
      CLUSTER_ID: 'kiwa-kafka-3-7',
    })
    .withWaitStrategy(tc.Wait.forListeningPorts().withStartupTimeout(startupTimeoutMs))
    .withStartupTimeout(startupTimeoutMs)
    .start();

  const kafkaHost = kafka.getHost();
  const kafkaPort = kafka.getMappedPort(9092);
  const bootstrap = `${kafkaHost}:${kafkaPort}`;

  // Boot Schema Registry pointing at the Kafka container we just started.
  const schemaRegistry = await new tc.GenericContainer(schemaRegistryImage)
    .withExposedPorts(8081)
    .withEnvironment({
      SCHEMA_REGISTRY_HOST_NAME: 'schema-registry',
      SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS: `PLAINTEXT://${bootstrap}`,
      SCHEMA_REGISTRY_LISTENERS: 'http://0.0.0.0:8081',
    })
    .withWaitStrategy(tc.Wait.forHttp('/subjects', 8081).withStartupTimeout(startupTimeoutMs))
    .withStartupTimeout(startupTimeoutMs)
    .start();

  const registryHost = schemaRegistry.getHost();
  const registryPort = schemaRegistry.getMappedPort(8081);
  const schemaRegistryUrl = `http://${registryHost}:${registryPort}`;

  let stopped = false;
  return {
    bootstrap,
    schemaRegistryUrl,
    kafkaImage,
    schemaRegistryImage,
    async stop() {
      if (stopped) return;
      stopped = true;
      // Best-effort — stop both containers even if one throws.
      await Promise.allSettled([schemaRegistry.stop(), kafka.stop()]);
    },
  };
}

export interface MakeRealAdapterOptions {
  /**
   * Optional pre-provisioned testcontainers handle. When supplied the adapter
   * uses the handle directly + reports live endpoints. Injected by the
   * fidelity harness so one container pair boots once per test file.
   */
  container?: KafkaTestcontainersHandle;
  /**
   * Optional env override. Defaults to `process.env`. Tests inject fixtures
   * without mutating the real env.
   */
  env?: Record<string, string | undefined>;
}

export async function makeRealAdapter(
  opts: MakeRealAdapterOptions = {},
): Promise<KafkaEventPipelineAdapter> {
  const env = detectRealEnv(opts.env);
  if (!env && !opts.container) return makeSkippedRealAdapter();
  const resolved: RealEnv = env ?? {
    bootstrap: opts.container?.bootstrap ?? MOCK_KAFKA_BOOTSTRAP,
    schemaRegistryUrl: opts.container?.schemaRegistryUrl ?? MOCK_SCHEMA_REGISTRY_URL,
    clientId: 'dogfood-kafka-event-pipeline',
  };
  return makeConnectedRealAdapter(resolved, opts.container);
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
    rawProtocolFences: 0,
    isrAdvances: 0,
    schemaRegistryChecks: 0,
    testcontainersProbes: 0,
  };
}

function makeSkippedRealAdapter(): KafkaEventPipelineAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = emptyMetrics();

  function fail<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: KAFKA_ENV_MISSING });
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
      trace.push({ op: 'emitFidelity', ok: false, errorKind: KAFKA_ENV_MISSING });
    },
    driveRawProtocol: async () => fail<RawProtocolObservation>('driveRawProtocol'),
    driveIsrHighWatermark: async () =>
      fail<IsrHighWatermarkObservation>('driveIsrHighWatermark'),
    driveSchemaRegistry: async () => fail<SchemaRegistryObservation>('driveSchemaRegistry'),
    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      // Special-case: probe records the missing env WITHOUT throwing so a
      // caller who only wants to sample the probe can distinguish "container
      // unreachable" from "adapter refused to run".
      trace.push({
        op: 'driveTestcontainersProbe',
        ok: false,
        errorKind: KAFKA_ENV_MISSING,
      });
      return {
        bootstrap: '',
        schemaRegistryUrl: '',
        kafkaImage: KAFKA_IMAGE_DEFAULT,
        schemaRegistryImage: SCHEMA_REGISTRY_IMAGE_DEFAULT,
        reachable: false,
      };
    },
    metrics: () => ({ ...metricsAgg, latencySamplesMs: [...metricsAgg.latencySamplesMs] }),
    async reset() {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(
  env: RealEnv,
  container?: KafkaTestcontainersHandle,
): KafkaEventPipelineAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = emptyMetrics();

  async function aliveness(): Promise<boolean> {
    // TCP probe against the first bootstrap broker. Enough to record "broker
    // reachable" without pulling in confluent-kafka at this scope.
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
    trace.push({ op, ok: false, errorKind: REAL_ADAPTER_NOT_IMPLEMENTED });
    return Promise.reject(
      new Error(
        `${REAL_ADAPTER_NOT_IMPLEMENTED}: Real adapter for '${op}' is not implemented in the v1.31-2 scope`,
      ),
    );
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async driveProducer() {
      const ok = await aliveness();
      if (!ok) return notImplemented<ProducerObservation>('driveProducer');
      // Beyond aliveness, confluent-kafka would create the producer + send +
      // await the ack. In the v1.31-2 scope we stop here so the fidelity
      // harness records "broker OK, producer NOT_IMPLEMENTED".
      trace.push({
        op: 'driveProducer',
        ok: false,
        errorKind: REAL_ADAPTER_NOT_IMPLEMENTED,
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

    driveRawProtocol: async () => notImplemented<RawProtocolObservation>('driveRawProtocol'),
    driveIsrHighWatermark: async () =>
      notImplemented<IsrHighWatermarkObservation>('driveIsrHighWatermark'),
    driveSchemaRegistry: async () =>
      notImplemented<SchemaRegistryObservation>('driveSchemaRegistry'),

    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      // Probe reports actual endpoints so the caller can verify env parity
      // between mock + real. Under container-supplied mode we also confirm
      // the broker is reachable — under env-only mode we only surface the
      // config.
      const reachable = await aliveness();
      metricsAgg.testcontainersProbes += 1;
      const observation: TestcontainersProbeObservation = {
        bootstrap: env.bootstrap,
        schemaRegistryUrl: env.schemaRegistryUrl,
        kafkaImage: container?.kafkaImage ?? KAFKA_IMAGE_DEFAULT,
        schemaRegistryImage: container?.schemaRegistryImage ?? SCHEMA_REGISTRY_IMAGE_DEFAULT,
        reachable,
      };
      trace.push({
        op: 'driveTestcontainersProbe',
        ok: reachable,
        detail: {
          bootstrap: observation.bootstrap,
          schemaRegistryUrl: observation.schemaRegistryUrl,
          reachable,
        },
      });
      return observation;
    },

    metrics: () => ({ ...metricsAgg, latencySamplesMs: [...metricsAgg.latencySamplesMs] }),

    async reset() {
      trace.length = 0;
      metricsAgg.testcontainersProbes = 0;
    },
  };
}
