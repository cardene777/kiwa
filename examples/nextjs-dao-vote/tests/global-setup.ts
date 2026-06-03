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

const INITIAL_TOKEN = 100n * 10n ** 18n;
const VOTING_PERIOD = 100n;
const QUORUM = 50n * 10n ** 18n;

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

  const tokenArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/VoteToken.sol/VoteToken.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
  const daoArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/SimpleDao.sol/SimpleDao.json'), 'utf8'),
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

  const tokenHash = await wallet.deployContract({
    abi: tokenArtifact.abi as never,
    bytecode: tokenArtifact.bytecode.object,
    args: ['VoteToken', 'VOTE', INITIAL_TOKEN, account.address],
  });
  const tokenReceipt = await pub.waitForTransactionReceipt({ hash: tokenHash });
  const voteToken = tokenReceipt.contractAddress!;

  const daoHash = await wallet.deployContract({
    abi: daoArtifact.abi as never,
    bytecode: daoArtifact.bytecode.object,
    args: [voteToken, VOTING_PERIOD, QUORUM],
  });
  const daoReceipt = await pub.waitForTransactionReceipt({ hash: daoHash });
  const dao = daoReceipt.contractAddress!;

  const envContent = `NEXT_PUBLIC_ANVIL_PORT=${ANVIL_PORT}
NEXT_PUBLIC_VOTE_TOKEN=${voteToken}
NEXT_PUBLIC_DAO=${dao}
`;
  writeFileSync(resolve(exampleRoot, '.env.local'), envContent, 'utf8');
  process.env.ANVIL_PID = String(anvilProcess?.pid ?? 0);
}
