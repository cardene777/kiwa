import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createPublicClient, createWalletClient, defineChain, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const CHAIN_CONFIGS = [
  { id: 1, port: 8551, label: 'Mainnet' },
  { id: 10, port: 8552, label: 'Optimism' },
  { id: 8453, port: 8553, label: 'Base' },
] as const;

const PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const INITIAL_SUPPLY = 1_000n * 10n ** 18n;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

const processes: ChildProcess[] = [];

function waitForPort(port: number, host: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  return new Promise<void>((res, rej) => {
    const tryOnce = () => {
      const s = createServer();
      s.once('error', () => {
        s.close();
        res();
      });
      s.once('listening', () => {
        s.close(() => {
          if (Date.now() - start > timeoutMs) return rej(new Error(`port ${port} not ready`));
          setTimeout(tryOnce, 200);
        });
      });
      s.listen(port, host);
    };
    tryOnce();
  });
}

async function spawnAnvil(port: number, chainId: number): Promise<ChildProcess> {
  const p = spawn(
    'anvil',
    ['--port', String(port), '--chain-id', String(chainId), '--silent'],
    {
      stdio: 'ignore',
      detached: false,
    },
  );
  p.on('error', (e) => console.error(`anvil :${port} failed:`, e));
  await waitForPort(port, '127.0.0.1', 15_000);
  return p;
}

async function deploySimpleToken(
  port: number,
  chainId: number,
  symbol: string,
  noncePadding: number,
): Promise<Hex> {
  const artifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/SimpleToken.sol/SimpleToken.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

  const chain = defineChain({
    id: chainId,
    name: `chain-${chainId}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
  const account = privateKeyToAccount(PRIVATE_KEY);
  const wallet = createWalletClient({ account, chain, transport: http() });
  const pub = createPublicClient({ chain, transport: http() });

  // nonce padding: 同一 deployer の同一 nonce で deploy すると CREATE address が
  // 全 chain で同一になるため、chain ごとに dummy self-transfer で nonce をずらす
  for (let i = 0; i < noncePadding; i++) {
    const padHash = await wallet.sendTransaction({
      to: account.address,
      value: 0n,
    });
    await pub.waitForTransactionReceipt({ hash: padHash });
  }

  const hash = await wallet.deployContract({
    abi: artifact.abi as never,
    bytecode: artifact.bytecode.object,
    args: [`Token-${symbol}`, symbol, INITIAL_SUPPLY, account.address],
  });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error(`deploy failed on chain ${chainId}`);
  return receipt.contractAddress;
}

export default async function globalSetup() {
  const deployedAddresses: Record<string, Hex> = {};
  for (let i = 0; i < CHAIN_CONFIGS.length; i++) {
    const c = CHAIN_CONFIGS[i]!;
    const p = await spawnAnvil(c.port, c.id);
    processes.push(p);
    // chain 別に nonce padding (Mainnet=0 / Optimism=1 / Base=2) で deploy address を変える
    const addr = await deploySimpleToken(c.port, c.id, c.label, i);
    deployedAddresses[c.label] = addr;
  }

  const envContent = `NEXT_PUBLIC_MAINNET_PORT=${CHAIN_CONFIGS[0].port}
NEXT_PUBLIC_OPTIMISM_PORT=${CHAIN_CONFIGS[1].port}
NEXT_PUBLIC_BASE_PORT=${CHAIN_CONFIGS[2].port}
NEXT_PUBLIC_MAINNET_TOKEN=${deployedAddresses.Mainnet}
NEXT_PUBLIC_OPTIMISM_TOKEN=${deployedAddresses.Optimism}
NEXT_PUBLIC_BASE_TOKEN=${deployedAddresses.Base}
`;
  writeFileSync(resolve(exampleRoot, '.env.local'), envContent, 'utf8');
  process.env.ANVIL_PIDS = processes.map((p) => p.pid).filter(Boolean).join(',');
}
