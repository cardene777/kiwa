import { describe, expect, it } from 'vitest';
import { makeMockAdapter, MOCK_NATS_URL, NATS_IMAGE_DEFAULT } from '../src/adapters/mock.js';
import {
  detectRealEnv,
  makeRealAdapter,
  startNatsTestcontainers,
  type StartNatsTestcontainersOptions,
  type TestcontainersWaitStrategy,
} from '../src/adapters/real.js';

describe('testcontainers probe + real adapter env-gate', () => {
  it('T-DNT-001 mock adapter returns deterministic mock endpoints + reachable=true', async () => {
    const adapter = makeMockAdapter();
    const probe = await adapter.driveTestcontainersProbe();
    expect(probe.natsUrl).toBe(MOCK_NATS_URL);
    expect(probe.natsImage).toBe(NATS_IMAGE_DEFAULT);
    expect(probe.reachable).toBe(true);
  });

  it('T-DNT-002 detectRealEnv returns null when KIWA_MODE!=real', () => {
    const env = { KIWA_MODE: 'mock', NATS_KEY: 'x' };
    expect(detectRealEnv(env)).toBeNull();
  });

  it('T-DNT-003 detectRealEnv returns null when NATS_KEY absent', () => {
    const env = { KIWA_MODE: 'real' };
    expect(detectRealEnv(env)).toBeNull();
  });

  it('T-DNT-004 detectRealEnv resolves URL fallback when both signals present', () => {
    const env = { KIWA_MODE: 'real', NATS_KEY: 'k', NATS_URL: 'nats://custom:4222' };
    const resolved = detectRealEnv(env);
    expect(resolved).not.toBeNull();
    expect(resolved?.url).toBe('nats://custom:4222');
    expect(resolved?.clientName).toBe('dogfood-nats-jetstream');
  });

  it('T-DNT-005 makeRealAdapter without env + container returns skipped adapter', async () => {
    const original = process.env.KIWA_MODE;
    const originalKey = process.env.NATS_KEY;
    delete process.env.KIWA_MODE;
    delete process.env.NATS_KEY;
    try {
      const adapter = await makeRealAdapter();
      const probe = await adapter.driveTestcontainersProbe();
      // Skipped adapter — reports empty url + reachable=false + records NATS_ENV_MISSING.
      expect(probe.reachable).toBe(false);
      expect(probe.natsUrl).toBe('');
      const traces = adapter.traces();
      expect(traces.some((t) => t.errorKind === 'NATS_ENV_MISSING')).toBe(true);
    } finally {
      if (original !== undefined) process.env.KIWA_MODE = original;
      if (originalKey !== undefined) process.env.NATS_KEY = originalKey;
    }
  });

  it('T-DNT-006 startNatsTestcontainers with injected duck-typed module boots + reports live URL', async () => {
    // Duck-typed testcontainers fake — no docker needed, verifies wiring
    // path (image tag propagation + waitStrategy chain + port mapping).
    let sawExposed = [] as number[];
    let sawCommand: readonly string[] = [];
    const fake = makeFakeTestcontainers({
      onExposedPorts: (ports) => (sawExposed = [...ports]),
      onCommand: (cmd) => (sawCommand = cmd),
      port4222Mapped: 45222,
    });
    const opts: StartNatsTestcontainersOptions = {
      natsImage: 'nats:2.10.20-alpine',
      testcontainersModule: fake,
    };
    const handle = await startNatsTestcontainers(opts);
    expect(handle.natsImage).toBe('nats:2.10.20-alpine');
    expect(handle.natsUrl).toBe('nats://127.0.0.1:45222');
    expect(sawExposed).toEqual([4222, 8222]);
    expect(sawCommand).toContain('-js');
    await handle.stop();
    // Second stop is idempotent.
    await handle.stop();
  });

  it('T-DNT-007 startNatsTestcontainers surfaces a construction failure from the injected module', async () => {
    // Passing a rejected module import path in production is impossible to
    // test without patching global import; instead verify the failure path
    // by driving a synthetic module that throws on construction — mirrors
    // the "cannot import" outcome from the caller's perspective.
    const rejectingModule = makeFakeTestcontainers({
      throwOnConstruct: true,
      port4222Mapped: 0,
    });
    let caught: unknown;
    try {
      await startNatsTestcontainers({ testcontainersModule: rejectingModule });
    } catch (err) {
      caught = err;
    }
    expect((caught as Error).message).toContain('module missing');
  });
});

// -----------------------------------------------------------------------------
// Duck-typed testcontainers fake — implements just enough of the surface so
// startNatsTestcontainers can exercise its wiring end-to-end without pulling
// in the actual testcontainers module. Kept alongside the tests because it's
// only used from this file.
// -----------------------------------------------------------------------------

interface FakeConfig {
  onExposedPorts?: (ports: readonly number[]) => void;
  onCommand?: (cmd: readonly string[]) => void;
  port4222Mapped: number;
  throwOnConstruct?: boolean;
}

type FakeModule = NonNullable<StartNatsTestcontainersOptions['testcontainersModule']>;

function makeFakeTestcontainers(cfg: FakeConfig): FakeModule {
  const waitStrategy: TestcontainersWaitStrategy = {
    withStartupTimeout(): TestcontainersWaitStrategy {
      return waitStrategy;
    },
  };

  class FakeContainer {
    private ports: number[] = [];
    constructor(_image: string) {
      if (cfg.throwOnConstruct) throw new Error('module missing (synthetic)');
    }
    withExposedPorts(...ports: number[]): FakeContainer {
      this.ports = ports;
      cfg.onExposedPorts?.(ports);
      return this;
    }
    withCommand(cmd: readonly string[]): FakeContainer {
      cfg.onCommand?.(cmd);
      return this;
    }
    withWaitStrategy(_strategy: unknown): FakeContainer {
      return this;
    }
    withStartupTimeout(_ms: number): FakeContainer {
      return this;
    }
    async start(): Promise<{
      getHost(): string;
      getMappedPort(port: number): number;
      stop(): Promise<void>;
    }> {
      const ports = this.ports;
      const port4222 = cfg.port4222Mapped;
      return {
        getHost: () => '127.0.0.1',
        getMappedPort: (port: number) => {
          if (port === 4222) return port4222;
          if (port === 8222) return 8222;
          const idx = ports.indexOf(port);
          return idx >= 0 ? port + 40000 : port;
        },
        stop: async () => {},
      };
    }
  }

  return {
    GenericContainer: FakeContainer as unknown as FakeModule['GenericContainer'],
    Wait: {
      forListeningPorts: () => waitStrategy,
      forLogMessage: () => waitStrategy,
    },
  };
}
