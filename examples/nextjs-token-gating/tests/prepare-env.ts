import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { killAnvilFromPidFile } from '@dapp-e2e/core';

const DEFAULT_PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const CHAIN_ID = 31337;
const REUSE_PORT = 8545;
const READY_TIMEOUT_MS = 30_000;
const READY_INTERVAL_MS = 250;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');
const envLocalPath = resolve(exampleRoot, '.env.local');
const nextCacheDir = resolve(exampleRoot, '.next');
const pidFilePath = resolve(exampleRoot, '.context/anvil.pid');

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main(): Promise<void> {
  killAnvilFromPidFile(pidFilePath);

  const reusedPort = await tryReuseExistingAnvil(REUSE_PORT);
  const port = reusedPort ?? (await getFreePort());
  const child =
    reusedPort === null
      ? spawn('anvil', ['--port', String(port), '--silent', '--chain-id', String(CHAIN_ID)], {
          detached: true,
          stdio: 'ignore',
        })
      : null;

  if (child && child.pid === undefined) {
    throw new Error('anvil failed to start');
  }
  child?.unref();

  try {
    await waitForAnvil(port);

    const account = privateKeyToAccount(DEFAULT_PRIVATE_KEY);
    const chain = defineChain({
      id: CHAIN_ID,
      name: 'Anvil',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
    });
    const transport = http(`http://127.0.0.1:${port}`);
    const wallet = createWalletClient({ account, chain, transport });
    const publicClient = createPublicClient({ chain, transport });

    const nftArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/GateNFT.sol/GateNFT.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const gatedArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/GatedContent.sol/GatedContent.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    const nftHash = await wallet.deployContract({
      abi: nftArtifact.abi as never,
      bytecode: nftArtifact.bytecode.object,
    });
    const nftReceipt = await publicClient.waitForTransactionReceipt({ hash: nftHash });
    const gateNft = nftReceipt.contractAddress!;

    const gatedHash = await wallet.deployContract({
      abi: gatedArtifact.abi as never,
      bytecode: gatedArtifact.bytecode.object,
      args: [gateNft],
    });
    const gatedReceipt = await publicClient.waitForTransactionReceipt({ hash: gatedHash });
    const gatedContent = gatedReceipt.contractAddress!;

    writeEnvLocal({
      NEXT_PUBLIC_RUNTIME_MODE: 'test',
      NEXT_PUBLIC_ANVIL_PORT: String(port),
      NEXT_PUBLIC_GATE_NFT: gateNft,
      NEXT_PUBLIC_GATED_CONTENT: gatedContent,
    });
    if (child?.pid !== undefined) {
      writePidFile(child.pid, port);
    }
  } catch (error) {
    if (child?.pid !== undefined) {
      killPid(child.pid);
    }
    throw error;
  }
}

async function getFreePort(): Promise<number> {
  return 40_000 + Math.floor(Math.random() * 20_000);
}

async function tryReuseExistingAnvil(port: number): Promise<number | null> {
  try {
    const chainIdResponse = await rpc(port, 'eth_chainId', []);
    if (!chainIdResponse.ok) {
      return null;
    }
    const chainIdPayload = (await chainIdResponse.json()) as { result?: unknown };
    if (typeof chainIdPayload.result !== 'string') {
      return null;
    }
    const resetResponse = await rpc(port, 'anvil_reset', [{}]);
    if (!resetResponse.ok) {
      return null;
    }
    return port;
  } catch {
    return null;
  }
}

async function waitForAnvil(port: number): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await rpc(port, 'eth_chainId', []);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling until anvil is ready
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, READY_INTERVAL_MS));
  }
  throw new Error(`anvil failed to listen within ${READY_TIMEOUT_MS}ms`);
}

async function rpc(port: number, method: string, params: unknown[]): Promise<Response> {
  return await fetch(`http://127.0.0.1:${port}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
}

function writeEnvLocal(values: Record<string, string>): void {
  const envLocalDir = dirname(envLocalPath);
  if (!existsSync(envLocalDir)) {
    mkdirSync(envLocalDir, { recursive: true });
  }
  const content = Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  writeFileSync(envLocalPath, `${content}\n`, 'utf8');

  if (existsSync(nextCacheDir)) {
    rmSync(nextCacheDir, { recursive: true, force: true });
  }
}

function writePidFile(pid: number, port: number): void {
  const pidDir = dirname(pidFilePath);
  if (!existsSync(pidDir)) {
    mkdirSync(pidDir, { recursive: true });
  }
  writeFileSync(
    pidFilePath,
    `${JSON.stringify({
      pid,
      port,
      startedAt: new Date().toISOString(),
      command: 'anvil',
    })}\n`,
    'utf8',
  );
}

function killPid(pid: number): void {
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    return;
  }
}
