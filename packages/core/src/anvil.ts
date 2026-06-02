import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';

const STARTUP_TIMEOUT_MS = 10_000;
const SHUTDOWN_GRACE_MS = 2_000;
const START_RETRY_COUNT = 10;

const reservedPorts = new Set<number>();
let portAllocationQueue = Promise.resolve();

export interface AnvilHandle {
  port: number;
  stop: () => Promise<void>;
}

export async function getFreePort(): Promise<number> {
  const reservePort = async () => {
    for (let attempts = 0; attempts < 50; attempts += 1) {
      const port = await getOsAllocatedPort();
      if (reservedPorts.has(port)) continue;
      reservedPorts.add(port);
      return port;
    }

    throw new Error('Could not determine free port');
  };

  const result = portAllocationQueue.then(reservePort, reservePort);
  portAllocationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function getOsAllocatedPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr && typeof addr.port === 'number') {
        const { port } = addr;
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(port);
        });
        return;
      }

      server.close();
      reject(new Error('Could not determine free port'));
    });
  });
}

export async function startAnvil(
  opts: { port?: number } = {},
): Promise<AnvilHandle> {
  const attemptLimit = opts.port ? 1 : START_RETRY_COUNT;

  for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
    const port = opts.port ?? (await getFreePort());
    const child = spawn('anvil', ['--port', String(port), '--silent'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let fatalError: Error | null = null;
    const onError = (error: Error & { code?: string }) => {
      if (error.code === 'ENOENT') {
        fatalError = new Error('anvil not found in PATH');
        return;
      }
      console.warn(`anvil child process error before ready: ${error.message}`);
    };
    child.on('error', onError);

    let ready = false;
    try {
      ready = await waitForReady(child, port, STARTUP_TIMEOUT_MS, () => fatalError);
    } catch (error) {
      child.off('error', onError);
      safeKill(child);
      releasePort(port);
      throw error;
    }
    child.off('error', onError);
    if (ready) {
      return {
        port,
        stop: () => stopProcess(child, port),
      };
    }

    safeKill(child);
    releasePort(port);
  }

  throw new Error(`anvil failed to listen within ${STARTUP_TIMEOUT_MS}ms`);
}

function waitForReady(
  child: ChildProcess,
  port: number,
  timeoutMs: number,
  getFatalError: () => Error | null,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const intervalMs = 100;
    const timer = setInterval(async () => {
      const fatalError = getFatalError();
      if (fatalError) {
        clearInterval(timer);
        reject(fatalError);
        return;
      }

      if (Date.now() > deadline) {
        clearInterval(timer);
        resolve(false);
        return;
      }

      try {
        const res = await fetch(`http://127.0.0.1:${port}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_chainId',
            params: [],
          }),
        });
        if (res.ok) {
          clearInterval(timer);
          resolve(true);
        }
      } catch {
        // not ready yet
      }
    }, intervalMs);

    child.once('exit', () => {
      clearInterval(timer);
      resolve(false);
    });
  });
}

function safeKill(child: ChildProcess) {
  try {
    child.kill('SIGKILL');
  } catch {
    // ignore
  }
}

function releasePort(port: number) {
  reservedPorts.delete(port);
}

function stopProcess(child: ChildProcess, port: number): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      releasePort(port);
      resolve();
      return;
    }
    let resolved = false;
    const finish = (leaked = false) => {
      if (resolved) return;
      resolved = true;
      if (!leaked) {
        releasePort(port);
      }
      resolve();
    };
    child.once('exit', () => finish(false));
    const sigkillTimer = setTimeout(() => {
      safeKill(child);
    }, SHUTDOWN_GRACE_MS);
    const finalTimer = setTimeout(() => {
      clearTimeout(sigkillTimer);
      console.warn(
        `[anvil] process did not exit after SIGKILL, leaking port ${port} to avoid race`,
      );
      finish(true);
    }, SHUTDOWN_GRACE_MS + 2000);
    child.once('exit', () => {
      clearTimeout(sigkillTimer);
      clearTimeout(finalTimer);
    });
    try {
      child.kill('SIGTERM');
    } catch {
      clearTimeout(sigkillTimer);
      clearTimeout(finalTimer);
      safeKill(child);
      finish(false);
    }
  });
}
