import { existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
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

    writePidFile(pidFilePath, handle.pid);
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
  if (!existsSync(pidFilePath)) return;
  for (const pid of readPidsFromFile(pidFilePath)) {
    if (!isPidAlive(pid)) continue;
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // already dead
    }
  }
  try {
    unlinkSync(pidFilePath);
  } catch {
    // already removed
  }
}

function killExistingFromPidFile(pidFilePath: string): void {
  if (!existsSync(pidFilePath)) return;
  for (const pid of readPidsFromFile(pidFilePath)) {
    if (!isPidAlive(pid)) continue;
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // already dead
    }
  }
  try {
    unlinkSync(pidFilePath);
  } catch {
    // already removed
  }
}

function readPidsFromFile(pidFilePath: string): number[] {
  try {
    return readFileSync(pidFilePath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => Number.parseInt(line, 10))
      .filter((pid) => Number.isFinite(pid) && pid > 0);
  } catch {
    return [];
  }
}

function writePidFile(pidFilePath: string, pid: number): void {
  const dir = dirname(pidFilePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(pidFilePath, String(pid), 'utf8');
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export type { AnvilHandle };
