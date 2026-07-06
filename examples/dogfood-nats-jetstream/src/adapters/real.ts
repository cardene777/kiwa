/**
 * Real adapter — v1.31-4 promotes the v1.20-4 aliveness probe to a NATS
 * 2.10+ testcontainers boot path. Peer-dependency-free: the
 * `testcontainers` module is duck-typed so a missing peer dep degrades to
 * a `NATS_ENV_MISSING` state instead of a compile error.
 *
 * Two env-ready states are supported:
 *   1. `container` option supplied — the caller booted the NATS container
 *      via {@link startNatsTestcontainers} (typically in a vitest
 *      `beforeAll` so one container boots per test file) + hands the handle
 *      to the adapter. `driveTestcontainersProbe` reports the live NATS URL.
 *   2. `KIWA_MODE=real` + `NATS_KEY` populated — the caller has already
 *      provisioned NATS externally. The adapter reports the endpoints
 *      from `NATS_URL`.
 *
 * The v1.31-4 scope keeps every semantic op (jetstream / kv / object /
 * routing / durable / kv-revision / object-chunking) as
 * `REAL_ADAPTER_NOT_IMPLEMENTED` — the point is fidelity harness bring-up +
 * testcontainers probe, not a production nats.js client. That binding is a
 * follow-up milestone; the fidelity harness records the divergence as a
 * well-defined `REAL_ADAPTER_NOT_IMPLEMENTED` gap.
 */

import type {
  JetStreamDurableObservation,
  JetStreamObservation,
  KvRevisionObservation,
  KVObservation,
  NatsJetStreamAdapter,
  ObjectChunkingObservation,
  ObjectObservation,
  RoutingObservation,
  TestcontainersProbeObservation,
  TraceEvent,
} from './interface.js';
import { MOCK_NATS_URL, NATS_IMAGE_DEFAULT } from './mock.js';

/**
 * Error kind published on every rejected trace event when the environment
 * cannot reach a live NATS broker. The fidelity harness matches this
 * string to skip real-column assertions without failing.
 */
export const NATS_ENV_MISSING = 'NATS_ENV_MISSING';

/** Legacy alias — some tests still assert on `REAL_ADAPTER_NOT_IMPLEMENTED` verbatim. */
export const REAL_ADAPTER_NOT_IMPLEMENTED = 'REAL_ADAPTER_NOT_IMPLEMENTED';

export interface RealEnv {
  readonly url: string;
  readonly clientName: string;
}

/**
 * Detect whether the environment is opted-in for real-mode drives. Requires
 * BOTH `KIWA_MODE=real` + `NATS_KEY` to be set. `NATS_KEY` is the fidelity-
 * harness opt-in signal (mirrors the payment / auth / kafka v2 / redpanda
 * v2 examples). `NATS_URL` alone is not enough — we don't want CI-side
 * accidental container boots.
 */
export function detectRealEnv(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): RealEnv | null {
  if (env['KIWA_MODE'] !== 'real') return null;
  if (!env['NATS_KEY']) return null;
  const url = env['NATS_URL'] ?? MOCK_NATS_URL;
  const clientName = env['NATS_CLIENT_NAME'] ?? 'dogfood-nats-jetstream';
  return { url, clientName };
}

export class SkippedError extends Error {
  readonly code = NATS_ENV_MISSING;
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because KIWA_MODE=real + NATS_KEY are not set`,
    );
  }
}

/**
 * Handle returned by {@link startNatsTestcontainers}. The handle exposes
 * the container-mapped NATS URL + a `stop()` boundary the caller invokes in
 * an `afterAll`.
 */
export interface NatsTestcontainersHandle {
  readonly natsUrl: string;
  readonly natsImage: string;
  stop(): Promise<void>;
}

/**
 * Duck-typed shape for the `testcontainers` module. The adapter never
 * type-couples to testcontainers so a missing peer dependency degrades to
 * the `NATS_ENV_MISSING` state instead of a compile error.
 */
export interface TestcontainersModule {
  GenericContainer: new (image: string) => TestcontainersContainer;
  Wait: {
    forListeningPorts(): TestcontainersWaitStrategy;
    forLogMessage(message: string | RegExp): TestcontainersWaitStrategy;
  };
}

export interface TestcontainersContainer {
  withExposedPorts(...ports: number[]): TestcontainersContainer;
  withCommand(command: readonly string[]): TestcontainersContainer;
  withWaitStrategy(strategy: TestcontainersWaitStrategy): TestcontainersContainer;
  withStartupTimeout(ms: number): TestcontainersContainer;
  start(): Promise<TestcontainersStartedContainer>;
}

export interface TestcontainersWaitStrategy {
  withStartupTimeout(ms: number): TestcontainersWaitStrategy;
}

export interface TestcontainersStartedContainer {
  getHost(): string;
  getMappedPort(port: number): number;
  stop(): Promise<void>;
}

export interface StartNatsTestcontainersOptions {
  /** NATS image tag. Defaults to {@link NATS_IMAGE_DEFAULT}. */
  natsImage?: string;
  /** Startup timeout in milliseconds. Defaults to 60_000 (60s). */
  startupTimeoutMs?: number;
  /**
   * Optional override for the `testcontainers` module. Tests inject a duck-
   * typed fake so the adapter's boot path can be exercised without Docker.
   */
  testcontainersModule?: TestcontainersModule;
}

/**
 * Boot a NATS 2.10+ broker as a testcontainer. The caller owns the
 * lifecycle — invoke `stop()` in an `afterAll` block to avoid leaked
 * containers.
 *
 * NATS 2.10+ ships JetStream enabled by default when `--jetstream` is
 * passed; the command below wires up a memory-backed store so tests boot
 * quickly (~2-5s on a warm docker daemon).
 *
 * When the `testcontainers` package is missing at runtime the call throws a
 * `SkippedError` with `NATS_ENV_MISSING`; callers should catch it +
 * record the divergence via the adapter's trace log.
 */
export async function startNatsTestcontainers(
  opts: StartNatsTestcontainersOptions = {},
): Promise<NatsTestcontainersHandle> {
  const natsImage = opts.natsImage ?? NATS_IMAGE_DEFAULT;
  const startupTimeoutMs = opts.startupTimeoutMs ?? 60_000;

  let tc: TestcontainersModule;
  if (opts.testcontainersModule) {
    tc = opts.testcontainersModule;
  } else {
    try {
      tc = (await import('testcontainers' as string)) as unknown as TestcontainersModule;
    } catch {
      throw new SkippedError('startNatsTestcontainers');
    }
  }

  const nats = await new tc.GenericContainer(natsImage)
    .withExposedPorts(4222, 8222)
    .withCommand(['-js', '-m', '8222', '--store_dir', '/tmp/nats-jetstream'])
    .withWaitStrategy(tc.Wait.forListeningPorts().withStartupTimeout(startupTimeoutMs))
    .withStartupTimeout(startupTimeoutMs)
    .start();

  const host = nats.getHost();
  const clientPort = nats.getMappedPort(4222);
  const natsUrl = `nats://${host}:${clientPort}`;

  let stopped = false;
  return {
    natsUrl,
    natsImage,
    async stop() {
      if (stopped) return;
      stopped = true;
      await nats.stop();
    },
  };
}

export interface MakeRealAdapterOptions {
  /**
   * Optional pre-provisioned testcontainers handle. When supplied the
   * adapter uses the handle directly + reports live endpoints. Injected by
   * the fidelity harness so one NATS container boots once per test file.
   */
  container?: NatsTestcontainersHandle;
  /**
   * Optional env override. Defaults to `process.env`. Tests inject fixtures
   * without mutating the real env.
   */
  env?: Record<string, string | undefined>;
}

export async function makeRealAdapter(
  opts: MakeRealAdapterOptions = {},
): Promise<NatsJetStreamAdapter> {
  const env = detectRealEnv(opts.env);
  if (!env && !opts.container) return makeSkippedRealAdapter();
  const resolved: RealEnv = env ?? {
    url: opts.container?.natsUrl ?? MOCK_NATS_URL,
    clientName: 'dogfood-nats-jetstream',
  };
  return makeConnectedRealAdapter(resolved, opts.container);
}

type Metrics = ReturnType<NatsJetStreamAdapter['metrics']>;

function emptyMetrics(): Metrics {
  return {
    latencySamplesMs: [],
    jetstreamPublished: 0,
    jetstreamAcked: 0,
    kvOperations: 0,
    objectBytesStored: 0,
    routingDeliveries: 0,
    durableDeliveries: 0,
    durableQuarantined: 0,
    kvRevisionsWritten: 0,
    objectChunksWritten: 0,
    testcontainersProbes: 0,
  };
}

function makeSkippedRealAdapter(): NatsJetStreamAdapter {
  const trace: TraceEvent[] = [];

  function fail<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: NATS_ENV_MISSING });
    throw new SkippedError(op);
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    driveJetStream: async () => fail<JetStreamObservation>('driveJetStream'),
    driveKV: async () => fail<KVObservation>('driveKV'),
    driveObject: async () => fail<ObjectObservation>('driveObject'),
    driveRouting: async () => fail<RoutingObservation>('driveRouting'),
    async emitFidelity() {
      trace.push({ op: 'emitFidelity', ok: false, errorKind: NATS_ENV_MISSING });
    },
    driveJetStreamDurable: async () =>
      fail<JetStreamDurableObservation>('driveJetStreamDurable'),
    driveKvRevision: async () => fail<KvRevisionObservation>('driveKvRevision'),
    driveObjectChunking: async () =>
      fail<ObjectChunkingObservation>('driveObjectChunking'),
    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      // Probe-like op — record the missing env WITHOUT throwing so a
      // caller who only wants to sample the image tag list can distinguish
      // "unreachable" from "adapter refused to run".
      trace.push({
        op: 'driveTestcontainersProbe',
        ok: false,
        errorKind: NATS_ENV_MISSING,
      });
      return {
        natsUrl: '',
        natsImage: NATS_IMAGE_DEFAULT,
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
  container?: NatsTestcontainersHandle,
): NatsJetStreamAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = emptyMetrics();

  async function brokerAliveness(): Promise<boolean> {
    // NATS speaks its own protocol on 4222 by default. TCP connect is
    // enough to record "broker reachable" without pulling in nats.js at
    // this scope. We support the multi-URL form (`nats://a:4222,nats://b:4222`).
    const first = env.url.split(',')[0];
    if (!first) return false;
    let host = 'localhost';
    let port = 4222;
    try {
      const parsed = new URL(first);
      host = parsed.hostname || host;
      if (parsed.port) port = Number(parsed.port);
    } catch {
      const [rawHost, rawPort] = first.split(':');
      if (rawHost) host = rawHost;
      if (rawPort) port = Number(rawPort);
    }
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
      trace.push({ op: 'broker.aliveness', ok: true, detail: { url: env.url } });
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
        `${REAL_ADAPTER_NOT_IMPLEMENTED}: Real adapter for '${op}' is not implemented in the v1.31-4 scope`,
      ),
    );
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async driveJetStream() {
      const brokerOk = await brokerAliveness();
      if (!brokerOk) return notImplemented<JetStreamObservation>('driveJetStream');
      trace.push({
        op: 'driveJetStream',
        ok: false,
        errorKind: REAL_ADAPTER_NOT_IMPLEMENTED,
      });
      return notImplemented<JetStreamObservation>('driveJetStream');
    },
    driveKV: async () => notImplemented<KVObservation>('driveKV'),
    driveObject: async () => notImplemented<ObjectObservation>('driveObject'),
    driveRouting: async () => notImplemented<RoutingObservation>('driveRouting'),

    async emitFidelity() {
      trace.push({
        op: 'emitFidelity',
        ok: true,
        detail: { mode: 'real', url: env.url },
      });
    },

    driveJetStreamDurable: async () =>
      notImplemented<JetStreamDurableObservation>('driveJetStreamDurable'),
    driveKvRevision: async () => notImplemented<KvRevisionObservation>('driveKvRevision'),
    driveObjectChunking: async () =>
      notImplemented<ObjectChunkingObservation>('driveObjectChunking'),

    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      const reachable = await brokerAliveness();
      metricsAgg.testcontainersProbes += 1;
      const observation: TestcontainersProbeObservation = {
        natsUrl: env.url,
        natsImage: container?.natsImage ?? NATS_IMAGE_DEFAULT,
        reachable,
      };
      trace.push({
        op: 'driveTestcontainersProbe',
        ok: reachable,
        detail: {
          natsUrl: observation.natsUrl,
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
