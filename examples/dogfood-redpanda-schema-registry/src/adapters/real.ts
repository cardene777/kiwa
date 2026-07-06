/**
 * Real adapter — v1.31-3 promotes the v1.20-3 aliveness probe to a Redpanda
 * v23+ + Redpanda Console v2.x testcontainers pair. Peer-dependency-free:
 * the `testcontainers` module is duck-typed so a missing peer dep degrades
 * to a `REDPANDA_ENV_MISSING` state instead of a compile error.
 *
 * Two env-ready states are supported:
 *   1. `container` option supplied — the caller booted the containers via
 *      {@link startRedpandaTestcontainers} (typically in a vitest `beforeAll`
 *      so one pair boots per test file) + hands the handle to the adapter.
 *      `driveTestcontainersProbe` reports the live bootstrap + Console URL.
 *   2. `KIWA_MODE=real` + `REDPANDA_KEY` populated — the caller has already
 *      provisioned Redpanda + Console externally (docker-compose or a shared
 *      deployment). The adapter reports the endpoints from
 *      `REDPANDA_BOOTSTRAP` + `REDPANDA_CONSOLE_URL` +
 *      `SCHEMA_REGISTRY_URL`.
 *
 * The v1.31-3 scope keeps every semantic op (register / evolution / compat
 * modes / publish / transitive / subject strategies) as
 * `REAL_ADAPTER_NOT_IMPLEMENTED` — the point is fidelity-harness bring-up +
 * Console admin probe + testcontainers probe, not a production
 * confluent-schema-registry client. That binding is a follow-up milestone;
 * the fidelity harness records the divergence as a well-defined
 * `REAL_ADAPTER_NOT_IMPLEMENTED` gap.
 */

import type {
  CompatibilityObservation,
  ConsoleAdminObservation,
  EvolutionObservation,
  PublishObservation,
  RedpandaSchemaRegistryAdapter,
  RegisterObservation,
  SubjectStrategyObservation,
  TestcontainersProbeObservation,
  TraceEvent,
  TransitiveEvolutionObservation,
} from './interface.js';
import {
  MOCK_CONSOLE_URL,
  MOCK_REDPANDA_BOOTSTRAP,
  MOCK_SCHEMA_REGISTRY_URL,
  REDPANDA_CONSOLE_IMAGE_DEFAULT,
  REDPANDA_IMAGE_DEFAULT,
} from './mock.js';
import { createConsoleAdminClient } from '../console/index.js';

/**
 * Error kind published on every rejected trace event when the environment
 * cannot reach a live Redpanda broker + Console. The fidelity harness
 * matches this string to skip real-column assertions without failing.
 */
export const REDPANDA_ENV_MISSING = 'REDPANDA_ENV_MISSING';

/** Legacy alias — some tests still assert on `REAL_ADAPTER_NOT_IMPLEMENTED` verbatim. */
export const REAL_ADAPTER_NOT_IMPLEMENTED = 'REAL_ADAPTER_NOT_IMPLEMENTED';

export interface RealEnv {
  /** Broker bootstrap string (host:port,host:port). */
  readonly bootstrap: string;
  /** Console admin URL (http://host:port). */
  readonly consoleUrl: string;
  /** Schema Registry URL — Redpanda's bundled SR (http://host:port). */
  readonly registryUrl: string;
  readonly clientId: string;
}

/**
 * Detect whether the environment is opted-in for real-mode drives. Requires
 * BOTH `KIWA_MODE=real` + `REDPANDA_KEY` to be set. `REDPANDA_KEY` is the
 * fidelity-harness opt-in signal (mirrors the payment / auth / kafka v2
 * examples). `REDPANDA_BOOTSTRAP` alone is not enough — we don't want CI-
 * side accidental container boots.
 */
export function detectRealEnv(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): RealEnv | null {
  if (env['KIWA_MODE'] !== 'real') return null;
  if (!env['REDPANDA_KEY']) return null;
  const bootstrap = env['REDPANDA_BOOTSTRAP'] ?? MOCK_REDPANDA_BOOTSTRAP;
  const consoleUrl = env['REDPANDA_CONSOLE_URL'] ?? MOCK_CONSOLE_URL;
  const registryUrl = env['SCHEMA_REGISTRY_URL'] ?? MOCK_SCHEMA_REGISTRY_URL;
  const clientId = env['REDPANDA_CLIENT_ID'] ?? 'dogfood-redpanda-schema-registry';
  return { bootstrap, consoleUrl, registryUrl, clientId };
}

export class SkippedError extends Error {
  readonly code = REDPANDA_ENV_MISSING;
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because KIWA_MODE=real + REDPANDA_KEY are not set`,
    );
  }
}

/**
 * Handle returned by {@link startRedpandaTestcontainers}. The handle exposes
 * the container-mapped endpoints + a `stop()` boundary the caller invokes in
 * an `afterAll`.
 */
export interface RedpandaTestcontainersHandle {
  readonly bootstrap: string;
  readonly consoleUrl: string;
  readonly schemaRegistryUrl: string;
  readonly redpandaImage: string;
  readonly consoleImage: string;
  stop(): Promise<void>;
}

/**
 * Duck-typed shape for the `testcontainers` module. The adapter never
 * type-couples to testcontainers so a missing peer dependency degrades to
 * the `REDPANDA_ENV_MISSING` state instead of a compile error.
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

export interface StartRedpandaTestcontainersOptions {
  /** Redpanda image tag. Defaults to {@link REDPANDA_IMAGE_DEFAULT}. */
  redpandaImage?: string;
  /** Console image tag. Defaults to {@link REDPANDA_CONSOLE_IMAGE_DEFAULT}. */
  consoleImage?: string;
  /** Startup timeout in milliseconds. Defaults to 90_000 (90s). */
  startupTimeoutMs?: number;
  /**
   * Optional override for the `testcontainers` module. Tests inject a duck-
   * typed fake so the adapter's boot path can be exercised without Docker.
   */
  testcontainersModule?: TestcontainersModule;
}

/**
 * Boot a Redpanda broker + Console pair as testcontainers. The caller owns
 * the lifecycle — invoke `stop()` in an `afterAll` block to avoid leaked
 * containers.
 *
 * When the `testcontainers` package is missing at runtime the call throws a
 * `SkippedError` with `REDPANDA_ENV_MISSING`; callers should catch it +
 * record the divergence via the adapter's trace log.
 */
export async function startRedpandaTestcontainers(
  opts: StartRedpandaTestcontainersOptions = {},
): Promise<RedpandaTestcontainersHandle> {
  const redpandaImage = opts.redpandaImage ?? REDPANDA_IMAGE_DEFAULT;
  const consoleImage = opts.consoleImage ?? REDPANDA_CONSOLE_IMAGE_DEFAULT;
  const startupTimeoutMs = opts.startupTimeoutMs ?? 90_000;

  let tc: TestcontainersModule;
  if (opts.testcontainersModule) {
    tc = opts.testcontainersModule;
  } else {
    try {
      tc = (await import('testcontainers' as string)) as unknown as TestcontainersModule;
    } catch {
      throw new SkippedError('startRedpandaTestcontainers');
    }
  }

  // Redpanda v23+ ships Kafka wire + Schema Registry + Admin API in one
  // process; the `redpanda start` command flags surface each interface.
  const redpanda = await new tc.GenericContainer(redpandaImage)
    .withExposedPorts(9092, 8081, 9644)
    .withEnvironment({
      REDPANDA_MODE: 'dev-container',
    })
    .withCommand([
      'redpanda',
      'start',
      '--smp',
      '1',
      '--overprovisioned',
      '--kafka-addr',
      'PLAINTEXT://0.0.0.0:9092',
      '--advertise-kafka-addr',
      'PLAINTEXT://localhost:9092',
      '--pandaproxy-addr',
      'PLAINTEXT://0.0.0.0:8082',
      '--schema-registry-addr',
      '0.0.0.0:8081',
      '--set',
      'redpanda.auto_create_topics_enabled=true',
    ])
    .withWaitStrategy(tc.Wait.forListeningPorts().withStartupTimeout(startupTimeoutMs))
    .withStartupTimeout(startupTimeoutMs)
    .start();

  const redpandaHost = redpanda.getHost();
  const kafkaPort = redpanda.getMappedPort(9092);
  const schemaRegistryPort = redpanda.getMappedPort(8081);
  const bootstrap = `${redpandaHost}:${kafkaPort}`;
  const schemaRegistryUrl = `http://${redpandaHost}:${schemaRegistryPort}`;

  // Redpanda Console v2.x — reads Kafka + Schema Registry env vars.
  const consoleContainer = await new tc.GenericContainer(consoleImage)
    .withExposedPorts(8080)
    .withEnvironment({
      KAFKA_BROKERS: bootstrap,
      KAFKA_SCHEMAREGISTRY_ENABLED: 'true',
      KAFKA_SCHEMAREGISTRY_URLS: schemaRegistryUrl,
    })
    .withWaitStrategy(tc.Wait.forHttp('/api/health', 8080).withStartupTimeout(startupTimeoutMs))
    .withStartupTimeout(startupTimeoutMs)
    .start();

  const consoleHost = consoleContainer.getHost();
  const consolePort = consoleContainer.getMappedPort(8080);
  const consoleUrl = `http://${consoleHost}:${consolePort}`;

  let stopped = false;
  return {
    bootstrap,
    consoleUrl,
    schemaRegistryUrl,
    redpandaImage,
    consoleImage,
    async stop() {
      if (stopped) return;
      stopped = true;
      // Best-effort — stop both containers even if one throws.
      await Promise.allSettled([consoleContainer.stop(), redpanda.stop()]);
    },
  };
}

export interface MakeRealAdapterOptions {
  /**
   * Optional pre-provisioned testcontainers handle. When supplied the
   * adapter uses the handle directly + reports live endpoints. Injected by
   * the fidelity harness so one container pair boots once per test file.
   */
  container?: RedpandaTestcontainersHandle;
  /**
   * Optional env override. Defaults to `process.env`. Tests inject fixtures
   * without mutating the real env.
   */
  env?: Record<string, string | undefined>;
}

export async function makeRealAdapter(
  opts: MakeRealAdapterOptions = {},
): Promise<RedpandaSchemaRegistryAdapter> {
  const env = detectRealEnv(opts.env);
  if (!env && !opts.container) return makeSkippedRealAdapter();
  const resolved: RealEnv = env ?? {
    bootstrap: opts.container?.bootstrap ?? MOCK_REDPANDA_BOOTSTRAP,
    consoleUrl: opts.container?.consoleUrl ?? MOCK_CONSOLE_URL,
    registryUrl: opts.container?.schemaRegistryUrl ?? MOCK_SCHEMA_REGISTRY_URL,
    clientId: 'dogfood-redpanda-schema-registry',
  };
  return makeConnectedRealAdapter(resolved, opts.container);
}

type Metrics = ReturnType<RedpandaSchemaRegistryAdapter['metrics']>;

function emptyMetrics(): Metrics {
  return {
    latencySamplesMs: [],
    subjectsRegistered: 0,
    recordsPublished: 0,
    compatibilityRejections: 0,
    evolutionSteps: 0,
    transitiveChainSteps: 0,
    subjectStrategyProbes: 0,
    consoleAdminCalls: 0,
    testcontainersProbes: 0,
  };
}

function makeSkippedRealAdapter(): RedpandaSchemaRegistryAdapter {
  const trace: TraceEvent[] = [];

  function fail<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: REDPANDA_ENV_MISSING });
    throw new SkippedError(op);
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    driveRegister: async () => fail<RegisterObservation>('driveRegister'),
    driveEvolution: async () => fail<EvolutionObservation>('driveEvolution'),
    driveCompatibilityModes: async () =>
      fail<CompatibilityObservation>('driveCompatibilityModes'),
    drivePublish: async () => fail<PublishObservation>('drivePublish'),
    async emitFidelity() {
      trace.push({ op: 'emitFidelity', ok: false, errorKind: REDPANDA_ENV_MISSING });
    },
    driveEvolutionTransitive: async () =>
      fail<TransitiveEvolutionObservation>('driveEvolutionTransitive'),
    driveSubjectStrategies: async () =>
      fail<SubjectStrategyObservation>('driveSubjectStrategies'),
    async driveConsoleAdmin(): Promise<ConsoleAdminObservation> {
      // Probe-like op — record the missing env WITHOUT throwing so a caller
      // who only wants to sample the endpoint list can distinguish
      // "unreachable" from "adapter refused to run".
      trace.push({ op: 'driveConsoleAdmin', ok: false, errorKind: REDPANDA_ENV_MISSING });
      return {
        baseUrl: '',
        endpoints: [],
        healthOk: false,
        subjectsSeen: 0,
        schemaByIdReachable: false,
      };
    },
    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      trace.push({
        op: 'driveTestcontainersProbe',
        ok: false,
        errorKind: REDPANDA_ENV_MISSING,
      });
      return {
        bootstrap: '',
        consoleUrl: '',
        schemaRegistryUrl: '',
        redpandaImage: REDPANDA_IMAGE_DEFAULT,
        consoleImage: REDPANDA_CONSOLE_IMAGE_DEFAULT,
        reachable: false,
      };
    },
    metrics: () => emptyMetrics(),
    async reset() {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(
  env: RealEnv,
  container?: RedpandaTestcontainersHandle,
): RedpandaSchemaRegistryAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = emptyMetrics();

  async function brokerAliveness(): Promise<boolean> {
    // Redpanda speaks Kafka wire on the bootstrap host — TCP connect is
    // enough to record "broker reachable" without pulling in kafkajs.
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

  async function registryAliveness(): Promise<boolean> {
    try {
      const url = new URL('/subjects', env.registryUrl);
      const response = await fetch(url.toString(), { method: 'GET' });
      const ok = response.status === 200;
      trace.push({
        op: 'registry.aliveness',
        ok,
        detail: { registryUrl: env.registryUrl, status: response.status },
      });
      return ok;
    } catch (err) {
      trace.push({
        op: 'registry.aliveness',
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
        `${REAL_ADAPTER_NOT_IMPLEMENTED}: Real adapter for '${op}' is not implemented in the v1.31-3 scope`,
      ),
    );
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async driveRegister() {
      const brokerOk = await brokerAliveness();
      const registryOk = await registryAliveness();
      if (!brokerOk || !registryOk) return notImplemented<RegisterObservation>('driveRegister');
      trace.push({
        op: 'driveRegister',
        ok: false,
        errorKind: REAL_ADAPTER_NOT_IMPLEMENTED,
      });
      return notImplemented<RegisterObservation>('driveRegister');
    },
    driveEvolution: async () => notImplemented<EvolutionObservation>('driveEvolution'),
    driveCompatibilityModes: async () =>
      notImplemented<CompatibilityObservation>('driveCompatibilityModes'),
    drivePublish: async () => notImplemented<PublishObservation>('drivePublish'),

    async emitFidelity() {
      trace.push({
        op: 'emitFidelity',
        ok: true,
        detail: {
          mode: 'real',
          bootstrap: env.bootstrap,
          registryUrl: env.registryUrl,
          consoleUrl: env.consoleUrl,
        },
      });
    },

    driveEvolutionTransitive: async () =>
      notImplemented<TransitiveEvolutionObservation>('driveEvolutionTransitive'),
    driveSubjectStrategies: async () =>
      notImplemented<SubjectStrategyObservation>('driveSubjectStrategies'),

    async driveConsoleAdmin(): Promise<ConsoleAdminObservation> {
      // The Console admin endpoints are HTTP so we can actually hit them
      // under real mode — no confluent-schema-registry binding needed.
      const client = createConsoleAdminClient({ baseUrl: env.consoleUrl });
      const [health, listed] = await Promise.all([client.health(), client.listSubjects()]);
      let schemaByIdReachable = false;
      if (listed.subjects.length > 0) {
        // Try id 1 — Redpanda seeds its schema store with monotonically
        // increasing ids, so 1 exists once the registry has any subject.
        const schemaFetch = await client.getSchemaById(1);
        schemaByIdReachable = schemaFetch.ok;
      }
      const observation: ConsoleAdminObservation = {
        baseUrl: env.consoleUrl,
        endpoints: client.hits(),
        healthOk: health.ok && health.status === 'up',
        subjectsSeen: listed.subjects.length,
        schemaByIdReachable,
      };
      metricsAgg.consoleAdminCalls += client.hits().length;
      trace.push({
        op: 'driveConsoleAdmin',
        ok: observation.healthOk,
        detail: {
          baseUrl: observation.baseUrl,
          subjectsSeen: observation.subjectsSeen,
          endpointCount: client.hits().length,
        },
      });
      return observation;
    },

    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      const reachable = await brokerAliveness();
      metricsAgg.testcontainersProbes += 1;
      const observation: TestcontainersProbeObservation = {
        bootstrap: env.bootstrap,
        consoleUrl: env.consoleUrl,
        schemaRegistryUrl: env.registryUrl,
        redpandaImage: container?.redpandaImage ?? REDPANDA_IMAGE_DEFAULT,
        consoleImage: container?.consoleImage ?? REDPANDA_CONSOLE_IMAGE_DEFAULT,
        reachable,
      };
      trace.push({
        op: 'driveTestcontainersProbe',
        ok: reachable,
        detail: {
          bootstrap: observation.bootstrap,
          consoleUrl: observation.consoleUrl,
          reachable,
        },
      });
      return observation;
    },

    metrics: () => ({ ...metricsAgg, latencySamplesMs: [...metricsAgg.latencySamplesMs] }),

    async reset() {
      trace.length = 0;
      metricsAgg.consoleAdminCalls = 0;
      metricsAgg.testcontainersProbes = 0;
    },
  };
}
