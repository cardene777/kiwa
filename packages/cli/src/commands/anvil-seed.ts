import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

export interface AnvilSeedOptions {
  scriptPath: string;
  outPath: string;
  cwd: string;
  chainId?: number;
  port?: number;
  /** seconds to wait after script completes before stopping anvil so dump-state can flush */
  flushMs?: number;
}

export interface AnvilSeedResult {
  outPath: string;
  port: number;
}

const DEFAULT_FLUSH_MS = 500;
const STARTUP_TIMEOUT_MS = 10_000;

async function isPortListening(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForReady(port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortListening(port)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`anvil seed: failed to start on port ${port} within ${timeoutMs}ms`);
}

async function getFreePort(): Promise<number> {
  const net = await import('node:net');
  return new Promise((resolveFn, rejectFn) => {
    const server = net.createServer();
    server.unref();
    server.on('error', rejectFn);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr && typeof addr.port === 'number') {
        const { port } = addr;
        server.close((err) => (err ? rejectFn(err) : resolveFn(port)));
        return;
      }
      server.close();
      rejectFn(new Error('getFreePort failed'));
    });
  });
}

export async function runAnvilSeed(opts: AnvilSeedOptions): Promise<AnvilSeedResult> {
  const scriptPath = isAbsolute(opts.scriptPath) ? opts.scriptPath : resolve(opts.cwd, opts.scriptPath);
  const outPath = isAbsolute(opts.outPath) ? opts.outPath : resolve(opts.cwd, opts.outPath);
  if (!existsSync(scriptPath)) {
    throw new Error(`anvil seed: script not found: ${scriptPath}`);
  }
  mkdirSync(dirname(outPath), { recursive: true });

  const port = opts.port ?? (await getFreePort());
  const chainId = opts.chainId ?? 31337;
  const args = [
    '--port',
    String(port),
    '--chain-id',
    String(chainId),
    '--silent',
    '--dump-state',
    outPath,
  ];

  const anvilChild = spawn('anvil', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let exited = false;
  anvilChild.on('exit', () => {
    exited = true;
  });

  try {
    await waitForReady(port, STARTUP_TIMEOUT_MS);
  } catch (error) {
    if (!exited) anvilChild.kill('SIGTERM');
    throw error;
  }

  const env = { ...process.env, ANVIL_RPC_URL: `http://127.0.0.1:${port}`, ANVIL_PORT: String(port) };
  const scriptChild = spawn(process.execPath, ['--enable-source-maps', scriptPath], {
    stdio: 'inherit',
    env,
    cwd: opts.cwd,
  });

  const exitCode: number = await new Promise((resolveFn) => {
    scriptChild.on('exit', (code) => resolveFn(code ?? 0));
  });

  await new Promise((r) => setTimeout(r, opts.flushMs ?? DEFAULT_FLUSH_MS));

  if (!exited) {
    anvilChild.kill('SIGTERM');
    await new Promise<void>((resolveFn) => {
      const timer = setTimeout(() => {
        if (!exited) anvilChild.kill('SIGKILL');
        resolveFn();
      }, 3000);
      anvilChild.on('exit', () => {
        clearTimeout(timer);
        resolveFn();
      });
    });
  }

  if (exitCode !== 0) {
    throw new Error(`anvil seed: script exited with code ${exitCode}`);
  }
  if (!existsSync(outPath)) {
    throw new Error(`anvil seed: dump-state file was not produced at ${outPath}`);
  }
  return { outPath, port };
}
