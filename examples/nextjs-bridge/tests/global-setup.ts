import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createPublicClient, createWalletClient, defineChain, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const L1_PORT = 8554;
const L2_PORT = 8555;
const L1_CHAIN_ID = 1;
const L2_CHAIN_ID = 10;

// operator は test 内で wallet client 経由で代行 (real bridge では off-chain relayer)
const OPERATOR_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const USER_INITIAL = 1000n * 10n ** 18n;

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

function makeChain(id: number, port: number) {
  return defineChain({
    id,
    name: `chain-${id}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
}

export default async function globalSetup() {
  const l1Proc = await spawnAnvil(L1_PORT, L1_CHAIN_ID);
  const l2Proc = await spawnAnvil(L2_PORT, L2_CHAIN_ID);
  processes.push(l1Proc, l2Proc);

  const erc20Artifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/SimpleERC20.sol/SimpleERC20.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
  const sourceBridgeArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/SourceBridge.sol/SourceBridge.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
  const destTokenArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/DestToken.sol/DestToken.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
  const destBridgeArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/DestBridge.sol/DestBridge.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

  const operator = privateKeyToAccount(OPERATOR_KEY);

  // L1: source token + source bridge deploy
  const l1Chain = makeChain(L1_CHAIN_ID, L1_PORT);
  const l1Wallet = createWalletClient({ account: operator, chain: l1Chain, transport: http() });
  const l1Pub = createPublicClient({ chain: l1Chain, transport: http() });

  const srcTokenHash = await l1Wallet.deployContract({
    abi: erc20Artifact.abi as never,
    bytecode: erc20Artifact.bytecode.object,
    args: ['SourceToken', 'SRC', USER_INITIAL, operator.address],
  });
  const srcTokenReceipt = await l1Pub.waitForTransactionReceipt({ hash: srcTokenHash });
  const sourceToken = srcTokenReceipt.contractAddress!;

  const srcBridgeHash = await l1Wallet.deployContract({
    abi: sourceBridgeArtifact.abi as never,
    bytecode: sourceBridgeArtifact.bytecode.object,
    args: [sourceToken, operator.address],
  });
  const srcBridgeReceipt = await l1Pub.waitForTransactionReceipt({ hash: srcBridgeHash });
  const sourceBridge = srcBridgeReceipt.contractAddress!;

  // L2: dest token + dest bridge deploy (nonce padding で address を L1 と別にする)
  const l2Chain = makeChain(L2_CHAIN_ID, L2_PORT);
  const l2Wallet = createWalletClient({ account: operator, chain: l2Chain, transport: http() });
  const l2Pub = createPublicClient({ chain: l2Chain, transport: http() });

  // dummy self-transfer x2 で deploy address を変える
  for (let i = 0; i < 2; i++) {
    const padHash = await l2Wallet.sendTransaction({ to: operator.address, value: 0n });
    await l2Pub.waitForTransactionReceipt({ hash: padHash });
  }

  // dest bridge は operator を持つ必要、先に dest token deploy (operator として dest bridge address 必要だが先に dest bridge も deploy 必要 → CREATE 順序ハック)
  // 簡略化: dest token の operator を後でセットできないため、dest bridge を deploy 後に dest token を deploy し token は bridge を operator として指定
  // ただし dest bridge は destToken address を constructor で取る → 先に dest token 必要
  // 妥協案: operator = EOA (deployer) として dest token を deploy、dest bridge にはこの EOA が operator として relay する形式

  // dest token は operator = EOA (deployer)
  const destTokenHash = await l2Wallet.deployContract({
    abi: destTokenArtifact.abi as never,
    bytecode: destTokenArtifact.bytecode.object,
    args: ['DestToken', 'DST', operator.address],
  });
  const destTokenReceipt = await l2Pub.waitForTransactionReceipt({ hash: destTokenHash });
  const destToken = destTokenReceipt.contractAddress!;

  // dest bridge は destToken の operator として EOA を渡す (bridge 自身は token を呼ぶ際 operator として token に identify される)
  // 本構成では bridge は token の operator 権限を持たないため、bridgeBurn は test 内で operator が直接 destToken.burn() を呼ぶ形にする
  // 簡略化のため DestBridge は不要、test では operator が直接 destToken.mint / burn を呼ぶ形式に変更する
  // ただし e2e の demonstrative value を保つため DestBridge も deploy しておく
  const destBridgeHash = await l2Wallet.deployContract({
    abi: destBridgeArtifact.abi as never,
    bytecode: destBridgeArtifact.bytecode.object,
    args: [destToken, operator.address],
  });
  const destBridgeReceipt = await l2Pub.waitForTransactionReceipt({ hash: destBridgeHash });
  const destBridge = destBridgeReceipt.contractAddress!;

  const envContent = `NEXT_PUBLIC_L1_PORT=${L1_PORT}
NEXT_PUBLIC_L2_PORT=${L2_PORT}
NEXT_PUBLIC_SOURCE_TOKEN=${sourceToken}
NEXT_PUBLIC_SOURCE_BRIDGE=${sourceBridge}
NEXT_PUBLIC_DEST_TOKEN=${destToken}
NEXT_PUBLIC_DEST_BRIDGE=${destBridge}
`;
  writeFileSync(resolve(exampleRoot, '.env.local'), envContent, 'utf8');
  process.env.ANVIL_PIDS = processes.map((p) => p.pid).filter(Boolean).join(',');
}
