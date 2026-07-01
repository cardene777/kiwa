import type {
  MemcachedAssertTTLExpected,
  MemcachedEntrySnapshot,
  MemcachedTestEnv,
  SetupMemcachedEnvOptions,
} from './types.js';
import { createStubMemcachedEnv } from './stub-memcached.js';

/**
 * Build a testcontainers-backed Memcached env. When `opts.testcontainers?.url`
 * is provided the helper connects directly to that URL and verifies
 * responsiveness. Otherwise the helper would spawn a real container — kept
 * behind an explicit `url` opt-in for the v0.2 scope so callers wanting
 * fully-managed containers can layer their own testcontainers wrapper on top.
 *
 * The wire path shares the stub simulation for entry state (so assertion
 * helpers stay deterministic) while surfacing the Memcached endpoint URL on
 * the env for callers that want to point their own `memjs` / `memcached`
 * client at it.
 */
export async function createTestcontainersMemcachedEnv(
  opts: SetupMemcachedEnvOptions,
): Promise<MemcachedTestEnv<'live'>> {
  const url = opts.testcontainers?.url;
  if (!url) {
    throw new Error(
      'setupMemcachedEnv: mode="testcontainers" requires testcontainers.url (v0.2 scope). Provide the URL of a running Memcached instance, or use mode="stub" for zero-infra tests.',
    );
  }
  await probeEndpoint(url, 3000);
  const inner = createStubMemcachedEnv(opts);
  const containerEnv: MemcachedTestEnv<'live'> = {
    mode: 'live',
    backend: 'testcontainers',
    memcachedUrl: url,
    client: inner.client,
    servers: inner.servers,
    get: inner.get.bind(inner),
    set: inner.set.bind(inner),
    delete: inner.delete.bind(inner),
    add: inner.add.bind(inner),
    replace: inner.replace.bind(inner),
    increment: inner.increment.bind(inner),
    decrement: inner.decrement.bind(inner),
    flush: inner.flush.bind(inner),
    ttl: inner.ttl.bind(inner),
    assertTTL: (key: string, expected: MemcachedAssertTTLExpected) =>
      inner.assertTTL(key, expected),
    serverFor: (key: string) => inner.serverFor(key),
    listEntries: (): MemcachedEntrySnapshot[] => inner.listEntries(),
    stop: inner.stop.bind(inner),
  };
  return containerEnv;
}

/**
 * Verify the Memcached endpoint accepts TCP connections. Memcached speaks a
 * text-based protocol on the wire; a bare socket probe with quick timeout is
 * enough to fail fast for unreachable endpoints. Parses `memcached://host:port`
 * URLs.
 */
async function probeEndpoint(url: string, timeoutMs: number): Promise<void> {
  const parsed = parseMemcachedUrl(url);
  const net = await import('node:net');
  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection(parsed.port, parsed.host);
    const timer = setTimeout(() => {
      socket.destroy();
      reject(
        new Error(
          `setupMemcachedEnv: Memcached at "${url}" did not respond within ${timeoutMs}ms`,
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
          `setupMemcachedEnv: Memcached at "${url}" did not respond — ${(err as Error).message}`,
        ),
      );
    });
  });
}

function parseMemcachedUrl(url: string): { host: string; port: number } {
  // Accept both `memcached://host:port` and bare `host:port`.
  const withoutScheme = url.replace(/^memcached:\/\//, '');
  const [host = 'localhost', portStr = '11211'] = withoutScheme.split(':');
  const port = Number.parseInt(portStr, 10);
  if (Number.isNaN(port)) {
    throw new Error(
      `setupMemcachedEnv: Memcached URL "${url}" — port "${portStr}" is not a valid integer`,
    );
  }
  return { host, port };
}
