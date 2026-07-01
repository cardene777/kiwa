import type {
  InngestEvent,
  InngestFunctionDefinition,
  InngestRunSnapshot,
  InngestTestEnv,
  SetupInngestEnvOptions,
} from './types.js';
import { createStubInngestEnv } from './stub-inngest.js';

interface DevServerHandle {
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

async function pingDevServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const probeUrl = `${url.replace(/\/+$/, '')}/health`;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(probeUrl, { method: 'GET' });
      if (response.ok) return;
    } catch {
      // dev-server not yet ready — retry after a short backoff.
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 200);
      (timer as unknown as { unref?: () => void }).unref?.();
    });
  }
  throw new Error(
    `@kiwa-test/queue: Inngest dev-server did not respond at ${probeUrl} within ${timeoutMs}ms`,
  );
}

async function spawnDevServer(
  port: number,
  timeoutMs: number,
): Promise<DevServerHandle> {
  let child_process: typeof import('node:child_process');
  try {
    child_process = await import('node:child_process');
  } catch (caught) {
    throw new Error(
      "@kiwa-test/queue: dev-server mode requires node:child_process (Node >= 20). Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }
  const spawn = child_process.spawn as unknown as (
    cmd: string,
    args: string[],
    opts: { stdio: string; env: NodeJS.ProcessEnv },
  ) => SpawnedProcess;
  const proc = spawn('npx', ['-y', 'inngest-cli@latest', 'dev', '--port', String(port), '--no-discovery'], {
    stdio: 'ignore',
    env: process.env,
  });
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
      console.warn('[kiwa-test/queue] Inngest dev-server exited with error:', err);
    }
  });
  try {
    await pingDevServer(url, timeoutMs);
  } catch (err) {
    await stop();
    throw err;
  }
  return { url, stop };
}

/**
 * Build a dev-server-backed Inngest env. When `devServer.url` is supplied the
 * helper reuses that dev-server; otherwise it spawns one via `npx inngest-cli@latest dev`.
 *
 * The env still runs function handlers in-process (matching v0.1 scope) but
 * every event goes through the real dev-server HTTP round-trip, so the wire
 * shape is prod-parity.
 */
export async function createDevServerInngestEnv(
  opts: SetupInngestEnvOptions & { appId: string },
): Promise<InngestTestEnv<'live'>> {
  let handle: DevServerHandle;
  if (opts.devServer?.url) {
    await pingDevServer(opts.devServer.url, opts.devServer.startupTimeoutMs ?? 5000);
    handle = { url: opts.devServer.url, stop: async () => {} };
  } else {
    handle = await spawnDevServer(
      opts.devServer?.port ?? 8288,
      opts.devServer?.startupTimeoutMs ?? 15000,
    );
  }

  // The in-process function dispatcher reuses the stub env so retry / step /
  // concurrency semantics stay consistent across backends. The dev-server
  // still receives the event so consumers can inspect it via the dashboard.
  const inner = createStubInngestEnv(opts);

  async function postEventToDevServer(event: InngestEvent): Promise<string> {
    const endpoint = `${handle.url.replace(/\/+$/, '')}/e/test-key`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: event.name,
        data: event.data,
        user: event.user ?? {},
        ts: event.ts ?? Date.now(),
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `@kiwa-test/queue: dev-server rejected event "${event.name}" (HTTP ${response.status}): ${body}`,
      );
    }
    try {
      const payload = (await response.json()) as { ids?: string[] };
      return payload.ids?.[0] ?? event.id ?? '';
    } catch {
      return event.id ?? '';
    }
  }

  const env: InngestTestEnv<'live'> = {
    mode: 'live',
    backend: 'dev-server',
    appId: opts.appId,
    devServerUrl: handle.url,
    registerFunction(fn) {
      inner.registerFunction(fn as InngestFunctionDefinition);
    },
    async sendEvent<TData>(name: string, data: TData): Promise<string> {
      const event: InngestEvent<TData> = {
        name,
        data,
        ts: Date.now(),
      };
      const eventId = await postEventToDevServer(event);
      // Trigger the in-process handlers after the dev-server has acknowledged
      // the event — this keeps the two backends behaviourally aligned while
      // still exercising the real HTTP path.
      await inner.sendEvent(name, data);
      return eventId;
    },
    waitForRun: inner.waitForRun as unknown as InngestTestEnv<'live'>['waitForRun'],
    assertFunctionRan:
      inner.assertFunctionRan as unknown as InngestTestEnv<'live'>['assertFunctionRan'],
    assertFunctionFailed:
      inner.assertFunctionFailed as unknown as InngestTestEnv<'live'>['assertFunctionFailed'],
    assertRetried: inner.assertRetried as unknown as InngestTestEnv<'live'>['assertRetried'],
    assertStepRan: inner.assertStepRan as unknown as InngestTestEnv<'live'>['assertStepRan'],
    assertQueueDrained: inner.assertQueueDrained,
    listRuns: inner.listRuns,
    async stop() {
      await inner.stop();
      await handle.stop();
    },
  };
  return env;
}
