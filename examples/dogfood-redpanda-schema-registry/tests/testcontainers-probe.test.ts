/**
 * T-DRP-TC-* — testcontainers probe.
 *
 * The mock adapter surfaces deterministic placeholder endpoints so the
 * probe never fails in CI. The real adapter (env-skip path) surfaces a
 * REDPANDA_ENV_MISSING divergence + empty endpoints when neither
 * `KIWA_MODE=real` nor a container handle is supplied.
 *
 * v1.31-3 additionally exercises the duck-typed testcontainers module
 * factory via `startRedpandaTestcontainers` with an injected fake so the
 * boot path is tested end-to-end without pulling Docker.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter, startRedpandaTestcontainers } from '../src/adapters/real.js';

describe('driveTestcontainersProbe — mock', () => {
  it('T-DRP-TC-001 mock adapter reports deterministic placeholders + reachable=true', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveTestcontainersProbe();
    expect(out.reachable).toBe(true);
    expect(out.bootstrap).toContain('redpanda-mock');
    expect(out.consoleUrl).toContain('redpanda-console-mock');
    expect(out.redpandaImage).toContain('redpandadata/redpanda');
    expect(out.consoleImage).toContain('redpandadata/console');
    await adapter.reset();
  });

  it('T-DRP-TC-002 metrics counter testcontainersProbes advances by 1 per call', async () => {
    const adapter = makeMockAdapter();
    const before = adapter.metrics().testcontainersProbes;
    await adapter.driveTestcontainersProbe();
    const after = adapter.metrics().testcontainersProbes;
    expect(after - before).toBe(1);
    await adapter.reset();
  });
});

describe('driveTestcontainersProbe — real (env-skip)', () => {
  it('T-DRP-TC-003 skipped real adapter surfaces empty endpoints + reachable=false', async () => {
    // Neither KIWA_MODE=real nor a container handle → skipped adapter.
    const adapter = await makeRealAdapter({ env: {} });
    const out = await adapter.driveTestcontainersProbe();
    expect(out.reachable).toBe(false);
    expect(out.bootstrap).toBe('');
    expect(out.consoleUrl).toBe('');
    const traces = adapter.traces();
    expect(traces.some((t) => t.op === 'driveTestcontainersProbe' && !t.ok)).toBe(true);
    await adapter.reset();
  });
});

describe('startRedpandaTestcontainers — duck-typed module injection', () => {
  it('T-DRP-TC-004 boots Redpanda + Console when a fake tc module is injected', async () => {
    const containers: { image: string; started: boolean; stopped: boolean }[] = [];
    const fakeStrategy = {
      withStartupTimeout(_ms: number) {
        return this;
      },
    };
    const fake = {
      GenericContainer: class {
        image: string;
        constructor(image: string) {
          this.image = image;
          containers.push({ image, started: false, stopped: false });
        }
        withExposedPorts(..._ports: number[]) {
          return this;
        }
        withEnvironment(_env: Record<string, string>) {
          return this;
        }
        withCommand(_cmd: readonly string[]) {
          return this;
        }
        withWaitStrategy(_s: unknown) {
          return this;
        }
        withStartupTimeout(_ms: number) {
          return this;
        }
        withNetworkMode(_m: string) {
          return this;
        }
        async start() {
          const rec = containers.find((c) => c.image === this.image && !c.started);
          if (rec) rec.started = true;
          return {
            getHost: () => 'localhost',
            getMappedPort: (port: number) => 20000 + port,
            stop: async () => {
              const stopRec = containers.find((c) => c.image === this.image && c.started && !c.stopped);
              if (stopRec) stopRec.stopped = true;
            },
          };
        }
      },
      Wait: {
        forHttp: () => fakeStrategy,
        forLogMessage: () => fakeStrategy,
        forListeningPorts: () => fakeStrategy,
      },
    };
    const handle = await startRedpandaTestcontainers({
      testcontainersModule: fake as never,
    });
    expect(handle.bootstrap).toBe('localhost:29092');
    expect(handle.consoleUrl).toBe('http://localhost:28080');
    expect(handle.schemaRegistryUrl).toBe('http://localhost:28081');
    // Both containers started.
    expect(containers.filter((c) => c.started)).toHaveLength(2);
    await handle.stop();
    // Idempotent stop.
    await handle.stop();
    expect(containers.filter((c) => c.stopped)).toHaveLength(2);
  });

  it('T-DRP-TC-005 stop() is idempotent even if a container throws', async () => {
    const fakeStrategy = { withStartupTimeout(_ms: number) { return this; } };
    let stopCalls = 0;
    const fake = {
      GenericContainer: class {
        constructor(_image: string) {}
        withExposedPorts(..._ports: number[]) { return this; }
        withEnvironment(_env: Record<string, string>) { return this; }
        withCommand(_cmd: readonly string[]) { return this; }
        withWaitStrategy(_s: unknown) { return this; }
        withStartupTimeout(_ms: number) { return this; }
        withNetworkMode(_m: string) { return this; }
        async start() {
          return {
            getHost: () => 'localhost',
            getMappedPort: (port: number) => 10000 + port,
            stop: async () => {
              stopCalls += 1;
              if (stopCalls === 1) throw new Error('flake');
            },
          };
        }
      },
      Wait: {
        forHttp: () => fakeStrategy,
        forLogMessage: () => fakeStrategy,
        forListeningPorts: () => fakeStrategy,
      },
    };
    const handle = await startRedpandaTestcontainers({
      testcontainersModule: fake as never,
    });
    await handle.stop();
    // Second stop returns immediately (idempotent guard).
    await handle.stop();
    // First stop tried to stop both containers; the flake surfaced via
    // Promise.allSettled so the second container still got stopped.
    expect(stopCalls).toBeGreaterThanOrEqual(2);
  });
});
