import type {
  CloudflareQueuesTestEnv,
  SetupCloudflareQueuesEnvOptions,
} from './types.js';
import { createMiniflareCloudflareQueuesEnv } from './miniflare-cloudflare-queues.js';

interface WranglerHandle {
  url: string;
  stop: () => Promise<void>;
}

/**
 * Minimal shape of the `child_process.spawn` result we honour. Structural so
 * tests can inject a fake without pulling `node:child_process` into the
 * public surface.
 */
interface SpawnedProcess {
  kill: (signal?: string) => boolean;
  once: (event: string, listener: (...args: unknown[]) => void) => void;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
}

async function pingWrangler(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  // wrangler dev exposes the worker root — the helper probes `/` and treats
  // any HTTP response (including 404) as a live server.
  const probeUrl = url.replace(/\/+$/, '');
  while (Date.now() < deadline) {
    try {
      const response = await fetch(probeUrl, { method: 'GET' });
      // Consider any HTTP response a signal the process is bound.
      if (response.status >= 100) return;
    } catch {
      // wrangler not yet ready — retry after a short backoff.
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 200);
      (timer as unknown as { unref?: () => void }).unref?.();
    });
  }
  throw new Error(
    `@kiwa-lab/queue: wrangler dev did not respond at ${probeUrl} within ${timeoutMs}ms`,
  );
}

async function spawnWrangler(
  port: number,
  timeoutMs: number,
): Promise<WranglerHandle> {
  let child_process: typeof import('node:child_process');
  try {
    child_process = await import('node:child_process');
  } catch (caught) {
    throw new Error(
      "@kiwa-lab/queue: wrangler mode requires node:child_process (Node >= 20). Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }
  const spawn = child_process.spawn as unknown as (
    cmd: string,
    args: string[],
    opts: { stdio: string; env: NodeJS.ProcessEnv },
  ) => SpawnedProcess;
  const proc = spawn(
    'npx',
    ['-y', 'wrangler@latest', 'dev', '--port', String(port), '--local'],
    {
      stdio: 'ignore',
      env: process.env,
    },
  );
  const url = `http://127.0.0.1:${port}`;
  let stopped = false;
  const stop = async (): Promise<void> => {
    if (stopped) return;
    stopped = true;
    try {
      proc.kill('SIGTERM');
    } catch {
      // ignore — process may have already exited.
    }
  };
  proc.once('error', (err) => {
    if (!stopped) {
      // eslint-disable-next-line no-console
      console.warn('[kiwa-test/queue] wrangler dev exited with error:', err);
    }
  });
  try {
    await pingWrangler(url, timeoutMs);
  } catch (err) {
    await stop();
    throw err;
  }
  return { url, stop };
}

/**
 * Build a wrangler-backed Cloudflare Queues env. When `wrangler.url` is
 * supplied the helper reuses that dev-server; otherwise it spawns one via
 * `npx wrangler@latest dev`.
 *
 * The env still runs consumer batch handlers in-process (matching v0.2
 * scope) via the miniflare simulation so retry / DLQ semantics stay
 * deterministic; the wrangler process provides the live wire so consumers
 * can verify their local `wrangler.toml` binds correctly.
 */
export async function createWranglerCloudflareQueuesEnv(
  opts: SetupCloudflareQueuesEnvOptions,
): Promise<CloudflareQueuesTestEnv<'live'>> {
  let handle: WranglerHandle;
  if (opts.wrangler?.url) {
    await pingWrangler(opts.wrangler.url, opts.wrangler.startupTimeoutMs ?? 5000);
    handle = { url: opts.wrangler.url, stop: async () => {} };
  } else {
    handle = await spawnWrangler(
      opts.wrangler?.port ?? 8787,
      opts.wrangler?.startupTimeoutMs ?? 15000,
    );
  }

  // The in-process dispatcher reuses the miniflare env so send / consumer
  // batch / retry / DLQ semantics stay consistent across backends. The
  // wrangler process is verified reachable at env creation time but not used
  // to drive message flow (v0.2 scope) so tests remain deterministic.
  const inner = createMiniflareCloudflareQueuesEnv(opts);

  const env: CloudflareQueuesTestEnv<'live'> = {
    mode: 'live',
    backend: 'wrangler',
    devServerUrl: handle.url,
    get queues() {
      return inner.queues;
    },
    registerConsumer: inner.registerConsumer as unknown as CloudflareQueuesTestEnv<'live'>['registerConsumer'],
    send: inner.send as unknown as CloudflareQueuesTestEnv<'live'>['send'],
    waitForMessage: inner.waitForMessage as unknown as CloudflareQueuesTestEnv<'live'>['waitForMessage'],
    assertAcknowledged:
      inner.assertAcknowledged as unknown as CloudflareQueuesTestEnv<'live'>['assertAcknowledged'],
    assertDeadLettered:
      inner.assertDeadLettered as unknown as CloudflareQueuesTestEnv<'live'>['assertDeadLettered'],
    assertRetried: inner.assertRetried as unknown as CloudflareQueuesTestEnv<'live'>['assertRetried'],
    assertQueueDrained: inner.assertQueueDrained,
    listMessages: inner.listMessages,
    listDeadLetters: inner.listDeadLetters,
    async stop() {
      await inner.stop();
      await handle.stop();
    },
  };
  return env;
}
