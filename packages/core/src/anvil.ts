import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';

const STARTUP_TIMEOUT_MS = 10_000;
const SHUTDOWN_GRACE_MS = 2_000;
const START_RETRY_COUNT = 10;
const PORT_RELEASE_WAIT_MS = 200;
const PID_POLL_INTERVAL_MS = 100;
const SIGTERM_WAIT_MS = 2_000;
const SIGKILL_WAIT_MS = 3_000;
const SLEEP_BUFFER = new Int32Array(new SharedArrayBuffer(4));

const reservedPorts = new Set<number>();
let portAllocationQueue = Promise.resolve();

export interface AnvilHandle {
  port: number;
  pid: number;
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

export interface StartAnvilOptions {
  port?: number;
  chainId?: number;
  /** detach child so Node parent can exit while anvil keeps running (default: false) */
  detached?: boolean;
  /** kill existing anvil on the port before spawn (default: false) */
  killExistingOnPort?: boolean;
}

export async function startAnvil(opts: StartAnvilOptions = {}): Promise<AnvilHandle> {
  return startAnvilProcess(opts);
}

export interface StartAnvilProcessOptions extends StartAnvilOptions {
  extraArgs?: string[];
  requirePristineChain?: boolean;
}

export async function startAnvilProcess(
  opts: StartAnvilProcessOptions = {},
): Promise<AnvilHandle> {
  if (opts.port && opts.killExistingOnPort) {
    killAnvilProcessesOnPort(opts.port);
    await delay(PORT_RELEASE_WAIT_MS);
  }

  const attemptLimit =
    opts.port && opts.killExistingOnPort ? START_RETRY_COUNT : opts.port ? 1 : START_RETRY_COUNT;

  for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
    const port = opts.port ?? (await getFreePort());
    const args = ['--port', String(port), '--silent', ...(opts.extraArgs ?? [])];
    if (opts.chainId !== undefined) {
      args.push('--chain-id', String(opts.chainId));
    }
    const child = spawn('anvil', args, {
      stdio: opts.detached === true ? 'ignore' : ['ignore', 'pipe', 'pipe'],
      detached: opts.detached === true,
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
      ready = await waitForReady(
        child,
        port,
        STARTUP_TIMEOUT_MS,
        () => fatalError,
        opts.chainId,
        opts.requirePristineChain ?? true,
      );
    } catch (error) {
      child.off('error', onError);
      safeKill(child);
      releasePort(port);
      throw error;
    }
    child.off('error', onError);
    if (ready) {
      if (opts.detached === true && child.pid !== undefined) {
        child.unref();
      }
      return {
        port,
        pid: child.pid ?? -1,
        stop: () => stopProcess(child, port),
      };
    }

    safeKill(child);
    releasePort(port);
  }

  throw new Error(`anvil failed to listen within ${STARTUP_TIMEOUT_MS}ms`);
}

function killAnvilProcessesOnPort(port: number): void {
  try {
    const result = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const listeners = result
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(1);
    for (const listener of listeners) {
      const columns = listener.split(/\s+/);
      const command = columns[0] ?? '';
      const pid = Number.parseInt(columns[1] ?? '', 10);
      if (!Number.isFinite(pid) || pid <= 0) continue;
      try {
        const baseName = command.split('/').pop() ?? command;
        if (baseName !== 'anvil') {
          console.warn(
            `[anvil] port ${port} occupied by non-anvil pid ${pid} (${command}), skipping`,
          );
          continue;
        }
        killPidWithWait(pid);
      } catch {
        // process already dead or no permission
      }
    }
  } catch {
    // lsof returns non-zero when nothing is listening, that is the happy path
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function killPidWithWait(pid: number): void {
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    return;
  }

  if (waitForPidExit(pid, SIGTERM_WAIT_MS)) {
    return;
  }

  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    return;
  }

  waitForPidExit(pid, SIGKILL_WAIT_MS);
}

function waitForPidExit(pid: number, timeoutMs: number): boolean {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() <= deadline) {
    if (!isPidAlive(pid)) {
      return true;
    }
    sleepSync(PID_POLL_INTERVAL_MS);
  }
  return !isPidAlive(pid);
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function sleepSync(ms: number): void {
  Atomics.wait(SLEEP_BUFFER, 0, 0, ms);
}

function waitForReady(
  child: ChildProcess,
  port: number,
  timeoutMs: number,
  getFatalError: () => Error | null,
  expectedChainId: number | undefined,
  requirePristineChain: boolean,
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
        const chainRes = await fetch(`http://127.0.0.1:${port}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_chainId',
            params: [],
          }),
        });
        if (!chainRes.ok) return;
        if (expectedChainId !== undefined) {
          const chainJson = (await chainRes.json()) as { result?: string };
          const chainIdHex = chainJson.result;
          const chainId =
            typeof chainIdHex === 'string' ? Number.parseInt(chainIdHex, 16) : Number.NaN;
          if (!Number.isFinite(chainId)) return;
          if (chainId !== expectedChainId) {
            return;
          }
        }

        if (!requirePristineChain) {
          clearInterval(timer);
          resolve(true);
          return;
        }

        const blockRes = await fetch(`http://127.0.0.1:${port}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'eth_blockNumber',
            params: [],
          }),
        });
        if (!blockRes.ok) return;

        const blockJson = (await blockRes.json()) as { result?: string };
        if (blockJson.result !== '0x0') {
          // orphan anvil (already has deployed blocks). reject and let caller retry / kill.
          return;
        }

        clearInterval(timer);
        resolve(true);
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
