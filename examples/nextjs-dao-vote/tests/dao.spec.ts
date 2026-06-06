import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  expectCustomError,
  mineBlock,
  setNextBlockTimestamp,
} from '@kiwa/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeFunctionData,
  http,
  parseAbi,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const INITIAL_TOKEN = 100n * 10n ** 18n;
const OWNER_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const SMALL_VOTER_PK =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;
const QUORUM_VOTES = 4n * 10n ** 18n;
const SMALL_VOTE = 3n * 10n ** 18n;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

const DAO_ABI = parseAbi([
  'function propose(string description) returns (uint256 id)',
  'function propose(address target, uint256 value, bytes data, string description) returns (uint256 id)',
  'function castVote(uint256 id, uint8 support) returns (uint256 weight)',
  'function queueProposal(uint256 id)',
  'function executeProposal(uint256 id)',
  'function proposalCount() view returns (uint256)',
  'function proposalView(uint256 id) view returns (address proposer, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes)',
  'function proposalExecutionView(uint256 id) view returns (address target, uint256 value, uint256 readyAt, bool queued, bool executed)',
  'function state(uint256 id) view returns (uint8)',
  'function quorumVotes() view returns (uint256)',
  'error VotingClosed()',
  'error QuorumNotReached(uint256 voted, uint256 required)',
  'error TimelockNotElapsed(uint256 readyAt, uint256 currentTime)',
]);

const TOKEN_ABI = parseAbi([
  'function transfer(address to, uint256 value) returns (bool)',
  'function delegate(address to)',
]);

const TARGET_ABI = parseAbi([
  'function setValue(uint256 value)',
  'function lastValue() view returns (uint256)',
  'function executeCount() view returns (uint256)',
  'error NotDao()',
]);

function anvilChain(port: number) {
  return defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
}

function readEnv() {
  const envPath = resolve(exampleRoot, '.env.local');
  return Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1)];
      }),
  ) as Record<string, string>;
}

function readArtifact<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(exampleRoot, relativePath), 'utf8')) as T;
}

function makeClients(port: number, privateKey: typeof OWNER_PK | typeof SMALL_VOTER_PK) {
  const account = privateKeyToAccount(privateKey);
  return {
    account,
    wallet: createWalletClient({
      account,
      chain: anvilChain(port),
      transport: http(),
    }),
    pub: createPublicClient({ chain: anvilChain(port), transport: http() }),
  };
}

async function createSimpleProposal(port: number) {
  const env = readEnv();
  const { account, wallet, pub } = makeClients(port, OWNER_PK);
  const dao = env.NEXT_PUBLIC_DAO as Address;
  const voteToken = env.NEXT_PUBLIC_VOTE_TOKEN as Address;

  const delegateHash = await wallet.writeContract({
    address: voteToken,
    abi: TOKEN_ABI,
    functionName: 'delegate',
    args: [account.address],
  });
  await pub.waitForTransactionReceipt({ hash: delegateHash });

  const beforeCount = await pub.readContract({
    address: dao,
    abi: DAO_ABI,
    functionName: 'proposalCount',
  });
  const proposeHash = await wallet.writeContract({
    address: dao,
    abi: DAO_ABI,
    functionName: 'propose',
    args: [`Proposal #${Date.now()}`],
  });
  await pub.waitForTransactionReceipt({ hash: proposeHash });
  return { dao, voteToken, proposalId: beforeCount + 1n, pub, wallet, account };
}

async function ensureConnected(page: import('@playwright/test').Page) {
  const connectBtn = page.getByRole('button', { name: /connect wallet/i });
  if (await connectBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await connectBtn.click();
    const injected = page.getByText(/browser wallet|injected/i).first();
    if (await injected.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await injected.click();
    }
  }
  await expect(page.getByTestId('connection-status')).toHaveText('status: connected', {
    timeout: 15_000,
  });
}

async function waitLoaded(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('my-votes')).not.toHaveText('myVotes: (loading)', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('proposal-count')).not.toHaveText('proposalCount: (loading)', {
    timeout: 30_000,
  });
}

test.describe('Next.js DAO Governor propose/vote e2e', () => {
  test('T-DAO-001 connect 後 myVotes が初期 0 (delegate 前) 表示', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('my-votes')).toContainText(/^myVotes: \d+$/);
  });

  test('T-DAO-002 Delegate to Self click → myVotes が INITIAL_TOKEN になる', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await page.getByTestId('delegate-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('my-votes')).toHaveText(`myVotes: ${INITIAL_TOKEN}`, {
      timeout: 15_000,
    });
  });

  test('T-DAO-003 Create Proposal で proposalCount が +1、currentId が新 id', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeCount = BigInt(
      ((await page.getByTestId('proposal-count').textContent()) ?? '')
        .replace('proposalCount: ', '')
        .trim(),
    );

    await page.getByTestId('propose-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('proposal-count')).toHaveText(
      `proposalCount: ${beforeCount + 1n}`,
      { timeout: 15_000 },
    );
    await expect(page.getByTestId('current-proposal-id')).toHaveText(
      `currentId: ${beforeCount + 1n}`,
      { timeout: 15_000 },
    );
    await expect(page.getByTestId('proposal-state')).toHaveText('state: Active', {
      timeout: 15_000,
    });
  });

  test('T-DAO-004 delegate → propose → Vote For で forVotes が INITIAL_TOKEN になる', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    await page.getByTestId('delegate-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('my-votes')).toHaveText(`myVotes: ${INITIAL_TOKEN}`, {
      timeout: 15_000,
    });

    await page.getByTestId('propose-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('proposal-state')).toHaveText('state: Active', {
      timeout: 15_000,
    });

    await page.getByTestId('vote-for-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('for-votes')).toHaveText(`forVotes: ${INITIAL_TOKEN}`, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('against-votes')).toHaveText('againstVotes: 0');
    await expect(page.getByTestId('abstain-votes')).toHaveText('abstainVotes: 0');
  });

  test('Vote Against / Abstain でも対応する counter が増える', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    await page.getByTestId('delegate-button').click();
    await dappE2e.waitForRpcIdle();

    await page.getByTestId('propose-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('proposal-state')).toHaveText('state: Active', {
      timeout: 15_000,
    });

    await page.getByTestId('vote-against-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('against-votes')).toHaveText(`againstVotes: ${INITIAL_TOKEN}`, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('for-votes')).toHaveText('forVotes: 0');
  });

  test('T-DAO-005 quorum 未達 proposal は executeProposal が QuorumNotReached(uint256,uint256) で revert', async ({
    anvilPort,
  }) => {
    const env = readEnv();
    const dao = env.NEXT_PUBLIC_DAO as Address;
    const voteToken = env.NEXT_PUBLIC_VOTE_TOKEN as Address;
    const owner = makeClients(anvilPort, OWNER_PK);
    const smallVoter = makeClients(anvilPort, SMALL_VOTER_PK);

    const transferHash = await owner.wallet.writeContract({
      address: voteToken,
      abi: TOKEN_ABI,
      functionName: 'transfer',
      args: [smallVoter.account.address, SMALL_VOTE],
    });
    await owner.pub.waitForTransactionReceipt({ hash: transferHash });

    const delegateHash = await smallVoter.wallet.writeContract({
      address: voteToken,
      abi: TOKEN_ABI,
      functionName: 'delegate',
      args: [smallVoter.account.address],
    });
    await smallVoter.pub.waitForTransactionReceipt({ hash: delegateHash });

    const beforeCount = await smallVoter.pub.readContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'proposalCount',
    });
    const proposeHash = await smallVoter.wallet.writeContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'propose',
      args: ['low turnout proposal'],
    });
    await smallVoter.pub.waitForTransactionReceipt({ hash: proposeHash });
    const proposalId = beforeCount + 1n;

    const voteHash = await smallVoter.wallet.writeContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'castVote',
      args: [proposalId, 1],
    });
    await smallVoter.pub.waitForTransactionReceipt({ hash: voteHash });

    const [, , endTime] = await smallVoter.pub.readContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'proposalView',
      args: [proposalId],
    });
    await setNextBlockTimestamp(smallVoter.pub, endTime + 1n);
    await mineBlock(smallVoter.pub);

    try {
      await smallVoter.pub.simulateContract({
        account: smallVoter.account.address,
        address: dao,
        abi: DAO_ABI,
        functionName: 'executeProposal',
        args: [proposalId],
      });
      throw new Error('expected QuorumNotReached revert');
    } catch (error) {
      expectCustomError(error, 'QuorumNotReached', [SMALL_VOTE, QUORUM_VOTES]);
    }
  });

  test('T-DAO-005A governance 外から execution target を直接叩くと NotDao() で revert', async ({
    anvilPort,
  }) => {
    const env = readEnv();
    const target = env.NEXT_PUBLIC_DAO_EXECUTION_TARGET as Address;
    const { account, pub } = makeClients(anvilPort, OWNER_PK);

    try {
      await pub.simulateContract({
        account: account.address,
        address: target,
        abi: TARGET_ABI,
        functionName: 'setValue',
        args: [99n],
      });
      throw new Error('expected NotDao revert');
    } catch (error) {
      expectCustomError(error, 'NotDao');
    }
  });

  test('T-DAO-005B 小さい totalSupply でも non-zero quorumBps なら quorumVotes は 1 以上に切り上がる', async ({
    anvilPort,
  }) => {
    const { wallet, pub, account } = makeClients(anvilPort, OWNER_PK);
    const tokenArtifact = readArtifact<{ abi: readonly unknown[]; bytecode: { object: Hex } }>(
      'forge-out/VoteToken.sol/VoteToken.json',
    );
    const daoArtifact = readArtifact<{ abi: readonly unknown[]; bytecode: { object: Hex } }>(
      'forge-out/SimpleDao.sol/SimpleDao.json',
    );

    const tokenHash = await wallet.deployContract({
      abi: tokenArtifact.abi as never,
      bytecode: tokenArtifact.bytecode.object,
      args: ['Tiny Vote', 'TVOTE', 3n, account.address],
    });
    const tokenReceipt = await pub.waitForTransactionReceipt({ hash: tokenHash });
    const voteToken = tokenReceipt.contractAddress!;

    const daoHash = await wallet.deployContract({
      abi: daoArtifact.abi as never,
      bytecode: daoArtifact.bytecode.object,
      args: [voteToken, 100n, 1n, 0n],
    });
    const daoReceipt = await pub.waitForTransactionReceipt({ hash: daoHash });
    const dao = daoReceipt.contractAddress!;

    const quorumVotes = await pub.readContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'quorumVotes',
    });

    expect(quorumVotes).toBeGreaterThanOrEqual(1n);
    expect(quorumVotes).toBe(1n);
  });

  test('T-DAO-006 deadline 超過後の castVote は VotingClosed() で revert', async ({ anvilPort }) => {
    const { dao, proposalId, pub, account } = await createSimpleProposal(anvilPort);

    const [, , endTime] = await pub.readContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'proposalView',
      args: [proposalId],
    });
    await setNextBlockTimestamp(pub, endTime + 1n);
    await mineBlock(pub);

    try {
      await pub.simulateContract({
        account: account.address,
        address: dao,
        abi: DAO_ABI,
        functionName: 'castVote',
        args: [proposalId, 1],
      });
      throw new Error('expected VotingClosed revert');
    } catch (error) {
      expectCustomError(error, 'VotingClosed');
    }
  });

  test('T-DAO-007 queue 後 timelock 経過で execute でき、早期 execute は TimelockNotElapsed で revert', async ({
    anvilPort,
  }) => {
    const env = readEnv();
    const dao = env.NEXT_PUBLIC_DAO as Address;
    const target = env.NEXT_PUBLIC_DAO_EXECUTION_TARGET as Address;
    const { account, wallet, pub } = makeClients(anvilPort, OWNER_PK);
    const voteToken = env.NEXT_PUBLIC_VOTE_TOKEN as Address;

    const delegateHash = await wallet.writeContract({
      address: voteToken,
      abi: TOKEN_ABI,
      functionName: 'delegate',
      args: [account.address],
    });
    await pub.waitForTransactionReceipt({ hash: delegateHash });

    const beforeCount = await pub.readContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'proposalCount',
    });
    const setValueData = encodeFunctionData({
      abi: TARGET_ABI,
      functionName: 'setValue',
      args: [42n],
    });
    const proposeHash = await wallet.writeContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'propose',
      args: [target, 0n, setValueData, 'execute target'],
    });
    await pub.waitForTransactionReceipt({ hash: proposeHash });
    const proposalId = beforeCount + 1n;

    const voteHash = await wallet.writeContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'castVote',
      args: [proposalId, 1],
    });
    await pub.waitForTransactionReceipt({ hash: voteHash });

    const [, , endTime] = await pub.readContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'proposalView',
      args: [proposalId],
    });
    await setNextBlockTimestamp(pub, endTime + 1n);
    await mineBlock(pub);

    const queueHash = await wallet.writeContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'queueProposal',
      args: [proposalId],
    });
    await pub.waitForTransactionReceipt({ hash: queueHash });

    const [, , readyAt] = await pub.readContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'proposalExecutionView',
      args: [proposalId],
    });
    const currentTime = (await pub.getBlock()).timestamp;

    try {
      await pub.simulateContract({
        account: account.address,
        address: dao,
        abi: DAO_ABI,
        functionName: 'executeProposal',
        args: [proposalId],
      });
      throw new Error('expected TimelockNotElapsed revert');
    } catch (error) {
      expectCustomError(error, 'TimelockNotElapsed', [readyAt, currentTime]);
    }

    await setNextBlockTimestamp(pub, readyAt + 1n);
    await mineBlock(pub);

    const executeHash = await wallet.writeContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'executeProposal',
      args: [proposalId],
    });
    await pub.waitForTransactionReceipt({ hash: executeHash });

    const lastValue = await pub.readContract({
      address: target,
      abi: TARGET_ABI,
      functionName: 'lastValue',
    });
    const executeCount = await pub.readContract({
      address: target,
      abi: TARGET_ABI,
      functionName: 'executeCount',
    });
    const state = await pub.readContract({
      address: dao,
      abi: DAO_ABI,
      functionName: 'state',
      args: [proposalId],
    });

    expect(lastValue).toBe(42n);
    expect(executeCount).toBeGreaterThanOrEqual(1n);
    expect(state).toBe(5);
  });
});
