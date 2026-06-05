import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  buildExecuteCallData,
  buildFactoryInitCode,
  buildUnsignedUserOperation,
  EIP1271_MAGIC_VALUE,
  ENTRY_POINT_ABI,
  getUserOperationHash,
  INCREMENT_CALLDATA,
  MOCK_TARGET_ABI,
  signUserOperation,
  SIMPLE_ACCOUNT_ABI,
  SIMPLE_ACCOUNT_FACTORY_ABI,
} from '../lib/aa';
import { sendUserOperation } from './lib/bundler-stub';
import { expect, test } from './fixture';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

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

function makeClients() {
  const env = readEnv();
  const owner = privateKeyToAccount(env.TEST_OWNER_PRIVATE_KEY as Hex);
  const bundler = privateKeyToAccount(env.BUNDLER_PRIVATE_KEY as Hex);
  const chain = defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
  });

  return {
    env,
    owner,
    publicClient: createPublicClient({ chain, transport: http() }),
    ownerWallet: createWalletClient({
      account: owner,
      chain,
      transport: http(),
    }),
    bundlerWallet: createWalletClient({
      account: bundler,
      chain,
      transport: http(),
    }),
  };
}

async function buildSignedIncrementUserOp() {
  const { env, owner, publicClient, ownerWallet } = makeClients();
  const sender = env.NEXT_PUBLIC_SMART_ACCOUNT as Address;
  const entryPoint = env.NEXT_PUBLIC_ENTRY_POINT as Address;
  const isDeployed = Boolean(await publicClient.getBytecode({ address: sender }));
  const nonce = isDeployed
    ? ((await publicClient.readContract({
        address: sender,
        abi: SIMPLE_ACCOUNT_ABI,
        functionName: 'nonce',
      })) as bigint)
    : 0n;

  const userOp = buildUnsignedUserOperation({
    sender,
    nonce,
    initCode: isDeployed
      ? '0x'
      : buildFactoryInitCode(
          env.NEXT_PUBLIC_FACTORY as Address,
          owner.address,
          BigInt(env.NEXT_PUBLIC_ACCOUNT_SALT),
        ),
    callData: buildExecuteCallData(
      env.NEXT_PUBLIC_MOCK_TARGET as Address,
      INCREMENT_CALLDATA,
    ),
  });

  return {
    env,
    entryPoint,
    sender,
    publicClient,
    ownerWallet,
    bundlerWallet: makeClients().bundlerWallet,
    userOp: await signUserOperation(ownerWallet, publicClient, entryPoint, userOp),
  };
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

test.describe.configure({ mode: 'serial' });

test.describe('nextjs-aa-erc4337', () => {
  test('T-AA37-001 SimpleAccountFactory で counterfactual address を取得', async () => {
    const { env, owner, publicClient } = makeClients();
    const predicted = (await publicClient.readContract({
      address: env.NEXT_PUBLIC_FACTORY as Address,
      abi: SIMPLE_ACCOUNT_FACTORY_ABI,
      functionName: 'getAddress',
      args: [owner.address, BigInt(env.NEXT_PUBLIC_ACCOUNT_SALT)],
    })) as Address;

    expect(predicted).toBe(env.NEXT_PUBLIC_SMART_ACCOUNT);
  });

  test('T-AA37-002 deploy 前に depositTo 後、UserOperation で deploy + execute を同時実行', async () => {
    const { env, publicClient, bundlerWallet } = makeClients();
    const entryPoint = env.NEXT_PUBLIC_ENTRY_POINT as Address;
    const sender = env.NEXT_PUBLIC_SMART_ACCOUNT as Address;
    const depositAmount = 10n ** 15n;

    const depositHash = await bundlerWallet.writeContract({
      address: entryPoint,
      abi: ENTRY_POINT_ABI,
      functionName: 'depositTo',
      args: [sender],
      value: depositAmount,
    });
    await publicClient.waitForTransactionReceipt({ hash: depositHash });

    const deposit = (await publicClient.readContract({
      address: entryPoint,
      abi: ENTRY_POINT_ABI,
      functionName: 'deposits',
      args: [sender],
    })) as bigint;
    expect(deposit).toBe(depositAmount);

    const { userOp } = await buildSignedIncrementUserOp();
    await sendUserOperation(bundlerWallet, publicClient, entryPoint, userOp);

    expect(await publicClient.getBytecode({ address: sender })).toBeTruthy();
    const counter = (await publicClient.readContract({
      address: env.NEXT_PUBLIC_MOCK_TARGET as Address,
      abi: MOCK_TARGET_ABI,
      functionName: 'counter',
    })) as bigint;
    expect(counter).toBe(1n);
  });

  test('T-AA37-003 UserOperation signature は owner EOA 署名で validateUserOp 成功', async () => {
    const { env, publicClient, bundlerWallet } = makeClients();
    const { entryPoint, sender, userOp } = await buildSignedIncrementUserOp();
    const userOpHash = await getUserOperationHash(publicClient, entryPoint, userOp);
    const signatureCheck = (await publicClient.readContract({
      address: sender,
      abi: SIMPLE_ACCOUNT_ABI,
      functionName: 'isValidSignature',
      args: [userOpHash, userOp.signature],
    })) as Hex;

    expect(signatureCheck).toBe(EIP1271_MAGIC_VALUE);

    await sendUserOperation(bundlerWallet, publicClient, entryPoint, userOp);
    const counter = (await publicClient.readContract({
      address: env.NEXT_PUBLIC_MOCK_TARGET as Address,
      abi: MOCK_TARGET_ABI,
      functionName: 'counter',
    })) as bigint;
    expect(counter).toBe(2n);
  });

  test('T-AA37-004 invalid signature の UserOperation は EntryPoint.handleOps で revert', async () => {
    const { publicClient, bundlerWallet, entryPoint, userOp } = await buildSignedIncrementUserOp();
    const invalidUserOp = { ...userOp, signature: `0x${'11'.repeat(65)}` as Hex };

    await expect(
      sendUserOperation(bundlerWallet, publicClient, entryPoint, invalidUserOp),
    ).rejects.toThrow(/validateUserOp reverted/i);
  });

  test('T-AA37-005 nonce 不一致の UserOperation は revert', async () => {
    const { publicClient, bundlerWallet, entryPoint, userOp } = await buildSignedIncrementUserOp();
    const wrongNonceUnsigned = { ...userOp, nonce: userOp.nonce + 7n, signature: '0x' as Hex };
    const wrongNonceSigned = await signUserOperation(
      makeClients().ownerWallet,
      publicClient,
      entryPoint,
      wrongNonceUnsigned,
    );

    await expect(
      sendUserOperation(bundlerWallet, publicClient, entryPoint, wrongNonceSigned),
    ).rejects.toThrow(/validateUserOp reverted/i);
  });

  test('T-AA37-006 dApp UI から sendUserOperation を呼んで MockTarget.counter が +1', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);

    const before = BigInt(
      (((await page.getByTestId('counter').textContent()) ?? '').replace('counter: ', '') || '0').trim(),
    );

    await page.getByTestId('increment-button').click();
    await expect(page.getByTestId('userop-status')).toHaveText('userOpStatus: confirmed', {
      timeout: 20_000,
    });
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('counter')).toHaveText(`counter: ${before + 1n}`, {
      timeout: 15_000,
    });
  });

  test('T-AA37-007 dappE2e fixture の contract account wallet は smart account address を eth_accounts に返す', async ({
    page,
  }) => {
    await page.goto('/');
    const accounts = await page.evaluate(async () => {
      const eth = (window as typeof window & {
        ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
      }).ethereum;
      return (await eth?.request({ method: 'eth_accounts' })) as string[];
    });

    expect(accounts).toEqual([readEnv().NEXT_PUBLIC_SMART_ACCOUNT]);
  });
});
