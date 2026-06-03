import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createPublicClient, createWalletClient, defineChain, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const ANVIL_PORT = 8545;
const PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const USER_COLLATERAL = 1000n * 10n ** 18n;
const POOL_LIQUIDITY = 5000n * 10n ** 18n;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

let anvilProcess: ChildProcess | undefined;

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

async function ensureAnvil() {
  anvilProcess = spawn('anvil', ['--port', String(ANVIL_PORT), '--silent'], {
    stdio: 'ignore',
    detached: false,
  });
  anvilProcess.on('error', (e) => console.error('anvil failed:', e));
  await waitForPort(ANVIL_PORT, '127.0.0.1', 15_000);
}

export default async function globalSetup() {
  await ensureAnvil();

  const erc20Artifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/SimpleERC20.sol/SimpleERC20.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
  const lendingArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/SimpleLending.sol/SimpleLending.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

  const chain = defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${ANVIL_PORT}`] } },
  });
  const account = privateKeyToAccount(PRIVATE_KEY);
  const wallet = createWalletClient({ account, chain, transport: http() });
  const pub = createPublicClient({ chain, transport: http() });

  // collateral token (user に USER_COLLATERAL mint)
  const cHash = await wallet.deployContract({
    abi: erc20Artifact.abi as never,
    bytecode: erc20Artifact.bytecode.object,
    args: ['Collateral', 'COLL', USER_COLLATERAL, account.address],
  });
  const cReceipt = await pub.waitForTransactionReceipt({ hash: cHash });
  const collateral = cReceipt.contractAddress!;

  // borrow token (deployer に POOL_LIQUIDITY mint → swap pool に transfer)
  const bHash = await wallet.deployContract({
    abi: erc20Artifact.abi as never,
    bytecode: erc20Artifact.bytecode.object,
    args: ['Borrow', 'BORR', POOL_LIQUIDITY, account.address],
  });
  const bReceipt = await pub.waitForTransactionReceipt({ hash: bHash });
  const borrow = bReceipt.contractAddress!;

  // lending pool
  const lHash = await wallet.deployContract({
    abi: lendingArtifact.abi as never,
    bytecode: lendingArtifact.bytecode.object,
    args: [collateral, borrow],
  });
  const lReceipt = await pub.waitForTransactionReceipt({ hash: lHash });
  const lending = lReceipt.contractAddress!;

  // pool に borrowToken liquidity 注入
  const TRANSFER_ABI = [
    {
      inputs: [
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'value', type: 'uint256' },
      ],
      name: 'transfer',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ] as const;
  const fundHash = await wallet.writeContract({
    address: borrow,
    abi: TRANSFER_ABI,
    functionName: 'transfer',
    args: [lending, POOL_LIQUIDITY],
  });
  await pub.waitForTransactionReceipt({ hash: fundHash });

  const envContent = `NEXT_PUBLIC_ANVIL_PORT=${ANVIL_PORT}
NEXT_PUBLIC_COLLATERAL=${collateral}
NEXT_PUBLIC_BORROW=${borrow}
NEXT_PUBLIC_LENDING=${lending}
`;
  writeFileSync(resolve(exampleRoot, '.env.local'), envContent, 'utf8');
  process.env.ANVIL_PID = String(anvilProcess?.pid ?? 0);
}
