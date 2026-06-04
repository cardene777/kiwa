import { execFileSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Chain,
  type Hex,
  type HttpTransport,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { startAnvil, type AnvilHandle } from './anvil.js';

const DEFAULT_PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const DEFAULT_PORT = 8545;
const DEFAULT_CHAIN_ID = 31337;
const PID_POLL_INTERVAL_MS = 100;
const SIGTERM_WAIT_MS = 2_000;
const SIGKILL_WAIT_MS = 3_000;
const SLEEP_BUFFER = new Int32Array(new SharedArrayBuffer(4));

export type PrepareEnvWalletClient = WalletClient<HttpTransport, Chain, PrivateKeyAccount>;
export type PrepareEnvPublicClient = PublicClient<HttpTransport, Chain>;

export interface PrepareEnvDeployContext {
  account: PrivateKeyAccount;
  wallet: PrepareEnvWalletClient;
  publicClient: PrepareEnvPublicClient;
  chain: Chain;
  port: number;
  exampleRoot: string;
}

export type PrepareEnvDeployFn = (
  ctx: PrepareEnvDeployContext,
) => Promise<Record<string, string>>;

export interface PrepareEnvOptions {
  exampleRoot: string;
  port?: number;
  chainId?: number;
  privateKey?: Hex;
  /** path to write `.env.local`, relative to exampleRoot (default: '.env.local') */
  envLocalPath?: string;
  /** path to .next directory to clean before build, relative to exampleRoot (default: '.next') */
  nextCacheDir?: string;
  /** path to store anvil pid, relative to exampleRoot (default: '.context/anvil.pid') */
  pidFilePath?: string;
  deploy: PrepareEnvDeployFn;
}

export interface PidEntry {
  pid: number;
  port?: number;
  startedAt?: string;
  command?: string;
}

/**
 * Prepare anvil + contracts + .env.local before Next.js build.
 * Designed to be invoked from `playwright.config.ts` webServer.command as
 *   `tsx tests/prepare-env.ts && pnpm build && pnpm start`.
 * After deploy finishes the anvil child is detached so the prepare-env Node
 * process can exit (event loop empty), letting `pnpm build` start next.
 */
export async function runE2EPrepareEnv(opts: PrepareEnvOptions): Promise<void> {
  const port = opts.port ?? DEFAULT_PORT;
  const chainId = opts.chainId ?? DEFAULT_CHAIN_ID;
  const privateKey = opts.privateKey ?? DEFAULT_PRIVATE_KEY;
  const envLocalPath = resolve(opts.exampleRoot, opts.envLocalPath ?? '.env.local');
  const nextCacheDir = resolve(opts.exampleRoot, opts.nextCacheDir ?? '.next');
  const pidFilePath = resolve(opts.exampleRoot, opts.pidFilePath ?? '.context/anvil.pid');

  killExistingFromPidFile(pidFilePath);

  const handle = await startAnvil({
    port,
    chainId,
    detached: true,
    killExistingOnPort: true,
  });
  const handleDetails = readProcessDetails(handle.pid);
  const startedAt =
    handleDetails && Number.isFinite(Date.parse(handleDetails.startedAt))
      ? new Date(Date.parse(handleDetails.startedAt)).toISOString()
      : new Date().toISOString();
  const command = handleDetails?.command.split('/').pop() ?? 'anvil';

  try {
    const account = privateKeyToAccount(privateKey);
    const chain = defineChain({
      id: chainId,
      name: 'Anvil',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [`http://127.0.0.1:${handle.port}`] } },
    });
    const wallet = createWalletClient({ account, chain, transport: http() });
    const publicClient = createPublicClient({ chain, transport: http() });

    const deployEnv = await opts.deploy({
      account,
      wallet,
      publicClient,
      chain,
      port: handle.port,
      exampleRoot: opts.exampleRoot,
    });

    const envContent = Object.entries({
      NEXT_PUBLIC_RUNTIME_MODE: 'test',
      NEXT_PUBLIC_ANVIL_PORT: String(handle.port),
      ...deployEnv,
    })
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    const envLocalDir = dirname(envLocalPath);
    if (!existsSync(envLocalDir)) {
      mkdirSync(envLocalDir, { recursive: true });
    }
    writeFileSync(envLocalPath, `${envContent}\n`, 'utf8');

    if (existsSync(nextCacheDir)) {
      rmSync(nextCacheDir, { recursive: true, force: true });
    }

    writePidEntry(pidFilePath, {
      pid: handle.pid,
      port: handle.port,
      startedAt,
      command,
    });
  } catch (error) {
    // deploy failure: kill anvil so we do not leak a process before exit
    await handle.stop();
    throw error;
  }
}

/**
 * Kill anvil whose pid was recorded by previous prepare-env run.
 * Used by `tests/global-teardown.ts` (and idempotently by prepare-env itself
 * before respawn).
 */
export function killAnvilFromPidFile(pidFilePath: string): void {
  killPidEntriesFromFile(pidFilePath);
}

function killExistingFromPidFile(pidFilePath: string): void {
  killPidEntriesFromFile(pidFilePath);
}

export function writePidEntry(pidFilePath: string, entry: PidEntry): void {
  const dir = dirname(pidFilePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  appendFileSync(pidFilePath, `${JSON.stringify(entry)}\n`, 'utf8');
}

function killPidEntriesFromFile(pidFilePath: string): void {
  if (!existsSync(pidFilePath)) return;
  for (const entry of readPidEntriesFromFile(pidFilePath)) {
    if (!isPidAlive(entry.pid)) continue;
    if (!matchesPidEntry(entry)) {
      console.warn(`[anvil] PID file stale or hijacked, skipping kill for pid ${entry.pid}`);
      continue;
    }
    killPidWithWait(entry.pid);
  }
  try {
    unlinkSync(pidFilePath);
  } catch {
    // already removed
  }
}

function readPidEntriesFromFile(pidFilePath: string): PidEntry[] {
  try {
    return readFileSync(pidFilePath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map(parsePidEntryLine)
      .filter((entry): entry is PidEntry => entry !== null);
  } catch {
    return [];
  }
}

function parsePidEntryLine(line: string): PidEntry | null {
  try {
    const parsed = JSON.parse(line) as unknown;
    if (typeof parsed === 'number') {
      return Number.isInteger(parsed) && parsed > 0 ? { pid: parsed } : null;
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const pid = Number(
        'pid' in parsed ? (parsed as { pid?: unknown }).pid : Number.NaN,
      );
      if (!Number.isInteger(pid) || pid <= 0) return null;
      const portValue = 'port' in parsed ? (parsed as { port?: unknown }).port : undefined;
      const startedAtValue =
        'startedAt' in parsed ? (parsed as { startedAt?: unknown }).startedAt : undefined;
      const commandValue =
        'command' in parsed ? (parsed as { command?: unknown }).command : undefined;
      const entry: PidEntry = { pid };
      if (typeof portValue === 'number') {
        entry.port = portValue;
      }
      if (typeof startedAtValue === 'string') {
        entry.startedAt = startedAtValue;
      }
      if (typeof commandValue === 'string') {
        entry.command = commandValue;
      }
      return entry;
    }
  } catch {
    // fall through to legacy raw PID parsing
  }

  const pid = Number.parseInt(line, 10);
  return Number.isInteger(pid) && pid > 0 ? { pid } : null;
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function matchesPidEntry(entry: PidEntry): boolean {
  const details = readProcessDetails(entry.pid);
  if (!details) return false;

  const actualCommand = details.command.split('/').pop() ?? details.command;
  if (actualCommand !== 'anvil') {
    return false;
  }

  if (entry.command) {
    const expectedCommand = entry.command.split('/').pop() ?? entry.command;
    if (expectedCommand !== actualCommand) {
      return false;
    }
  }

  if (!entry.startedAt) {
    return true;
  }

  const expectedStartedAtMs = Date.parse(entry.startedAt);
  const actualStartedAtMs = Date.parse(details.startedAt);
  if (!Number.isFinite(expectedStartedAtMs) || !Number.isFinite(actualStartedAtMs)) {
    return false;
  }

  return Math.abs(expectedStartedAtMs - actualStartedAtMs) < 1_000;
}

function readProcessDetails(pid: number): { startedAt: string; command: string } | null {
  try {
    const result = execFileSync('ps', ['-o', 'lstart=', '-o', 'comm=', '-p', String(pid)], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split('\n')
      .find((line) => line.trim().length > 0);
    if (!result) return null;

    const match = result.match(/^(.*?)\s+(\S+)$/);
    if (!match) return null;

    return {
      startedAt: match[1]!.trim(),
      command: match[2]!.trim(),
    };
  } catch {
    return null;
  }
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

function sleepSync(ms: number): void {
  Atomics.wait(SLEEP_BUFFER, 0, 0, ms);
}

export type { AnvilHandle };
