import type { KeyDBTestEnv, SetupKeyDBEnvOptions } from './types.js';
import { createStubKeyDBEnv } from './stub-keydb.js';

/**
 * Build a testcontainers-backed KeyDB env. When `opts.testcontainers?.url`
 * is provided the helper connects directly to that URL and verifies TCP
 * responsiveness. Otherwise the helper would spawn a real KeyDB container —
 * kept behind an explicit `url` opt-in for the v0.2 scope so callers wanting
 * fully-managed containers can layer their own testcontainers wrapper.
 *
 * KeyDB is Redis-compatible on the wire so callers can point their own
 * `ioredis` / `redis` client at `env.keydbUrl`; assertion helpers stay
 * deterministic by reusing the stub's replication simulation.
 */
export async function createTestcontainersKeyDBEnv(
  opts: SetupKeyDBEnvOptions,
): Promise<KeyDBTestEnv<'live'>> {
  const url = opts.testcontainers?.url;
  if (!url) {
    throw new Error(
      'setupKeyDBEnv: mode="testcontainers" requires testcontainers.url (v0.2 scope). Provide the URL of a running KeyDB instance, or use mode="stub" for zero-infra tests.',
    );
  }
  await probeEndpoint(url, 3000);
  const inner = createStubKeyDBEnv(opts);
  const containerEnv: KeyDBTestEnv<'live'> = {
    mode: 'live',
    backend: 'testcontainers',
    keydbUrl: url,
    client: inner.client,
    cluster: inner.cluster,
    get: inner.get.bind(inner),
    set: inner.set.bind(inner),
    delete: inner.delete.bind(inner),
    expire: inner.expire.bind(inner),
    ttl: inner.ttl.bind(inner),
    assertTTL: inner.assertTTL.bind(inner),
    publish: inner.publish.bind(inner),
    subscribe: inner.subscribe.bind(inner),
    assertPublished: inner.assertPublished.bind(inner),
    flushAll: inner.flushAll.bind(inner),
    listEntries: inner.listEntries.bind(inner),
    stop: inner.stop.bind(inner),
  };
  return containerEnv;
}

async function probeEndpoint(url: string, timeoutMs: number): Promise<void> {
  const parsed = parseKeyDBUrl(url);
  const net = await import('node:net');
  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection(parsed.port, parsed.host);
    const timer = setTimeout(() => {
      socket.destroy();
      reject(
        new Error(
          `setupKeyDBEnv: KeyDB at "${url}" did not respond within ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      socket.end();
      resolve();
    });
    socket.once('error', (err) => {
      clearTimeout(timer);
      reject(
        new Error(
          `setupKeyDBEnv: KeyDB at "${url}" did not respond — ${(err as Error).message}`,
        ),
      );
    });
  });
}

function parseKeyDBUrl(url: string): { host: string; port: number } {
  // Accept `keydb://host:port`, `redis://host:port`, or bare `host:port`.
  const withoutScheme = url.replace(/^(keydb|redis):\/\//, '');
  const [host = 'localhost', portStr = '6379'] = withoutScheme.split(':');
  const port = Number.parseInt(portStr, 10);
  if (Number.isNaN(port)) {
    throw new Error(
      `setupKeyDBEnv: KeyDB URL "${url}" — port "${portStr}" is not a valid integer`,
    );
  }
  return { host, port };
}
