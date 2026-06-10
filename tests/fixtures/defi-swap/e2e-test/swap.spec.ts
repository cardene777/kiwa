import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { expect } from '@playwright/test';
import {
  dappE2eTest as test,
  expectBalanceChange,
  expectCustomError,
  startAnvil,
  startAnvilFork,
} from '@kiwa-test/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseAbi,
  type Hex,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const erc20Artifact = JSON.parse(
  readFileSync(resolve(__dirname, '../forge-out/SwapTokens.sol/Erc20.json'), 'utf8'),
) as { abi: readonly unknown[]; bytecode: { object: Hex } };
const swapArtifact = JSON.parse(
  readFileSync(resolve(__dirname, '../forge-out/SwapTokens.sol/SimpleSwap.json'), 'utf8'),
) as { abi: readonly unknown[]; bytecode: { object: Hex } };

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 value) returns (bool)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
]);
const SWAP_ABI = parseAbi([
  'function swapAforB(uint256 amountIn) returns (uint256)',
  'function swapAforB(uint256 amountIn, uint256 minOutputAmount) returns (uint256)',
  'error SlippageExceeded(uint256 amountOut, uint256 minOutputAmount)',
  'error InsufficientLiquidity(uint256 amountOut, uint256 availableLiquidity)',
  'event Swapped(address indexed user, uint256 amountIn, uint256 amountOut)',
]);

const POOL_LIQUIDITY = 1000n * 10n ** 18n;
const USER_INITIAL = 100n * 10n ** 18n;
const SWAP_AMOUNT = 25n * 10n ** 18n;
const LARGE_USER_INITIAL = POOL_LIQUIDITY + 100n * 10n ** 18n;

function anvilChain(port: number) {
  return defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
}

async function setupSwap(
  port: number,
  options: {
    userInitial?: bigint;
    poolLiquidity?: bigint;
  } = {},
): Promise<{
  tokenA: Address;
  tokenB: Address;
  swap: Address;
  user: Address;
}> {
  const userInitial = options.userInitial ?? USER_INITIAL;
  const poolLiquidity = options.poolLiquidity ?? POOL_LIQUIDITY;
  const account = privateKeyToAccount(PRIVATE_KEY);
  const wallet = createWalletClient({
    account,
    chain: anvilChain(port),
    transport: http(),
  });
  const pub = createPublicClient({ chain: anvilChain(port), transport: http() });

  // deploy TokenA: mint USER_INITIAL to user
  const aHash = await wallet.deployContract({
    abi: erc20Artifact.abi as never,
    bytecode: erc20Artifact.bytecode.object,
    args: ['TokenA', 'TKA', userInitial, account.address],
  });
  const aReceipt = await pub.waitForTransactionReceipt({ hash: aHash });
  const tokenA = aReceipt.contractAddress!;

  // deploy TokenB: mint POOL_LIQUIDITY to deployer (then transfer to swap pool)
  const bHash = await wallet.deployContract({
    abi: erc20Artifact.abi as never,
    bytecode: erc20Artifact.bytecode.object,
    args: ['TokenB', 'TKB', poolLiquidity, account.address],
  });
  const bReceipt = await pub.waitForTransactionReceipt({ hash: bHash });
  const tokenB = bReceipt.contractAddress!;

  // deploy Swap
  const sHash = await wallet.deployContract({
    abi: swapArtifact.abi as never,
    bytecode: swapArtifact.bytecode.object,
    args: [tokenA, tokenB],
  });
  const sReceipt = await pub.waitForTransactionReceipt({ hash: sHash });
  const swap = sReceipt.contractAddress!;

  // fund swap with TokenB liquidity
  const fundHash = await wallet.writeContract({
    address: tokenB,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [swap, poolLiquidity],
  });
  await pub.waitForTransactionReceipt({ hash: fundHash });

  return { tokenA, tokenB, swap, user: account.address };
}

function makeDappHtml(tokenA: Address, tokenB: Address, swap: Address): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>defi-swap</title></head>
<body>
  <button id="connect">Connect</button>
  <button id="approve">Approve</button>
  <button id="swap">Swap</button>
  <button id="refresh">Refresh</button>
  <input id="swap-amount-input" data-testid="swap-amount-input" value="${SWAP_AMOUNT.toString()}" />
  <input id="slippage-input" data-testid="slippage-input" value="0" />
  <pre id="account"></pre>
  <pre id="balance-a"></pre>
  <pre id="balance-b"></pre>
  <pre id="allowance"></pre>
  <pre id="last-tx"></pre>
  <pre id="last-error"></pre>
  <script>
    const TOKEN_A = '${tokenA}';
    const TOKEN_B = '${tokenB}';
    const SWAP = '${swap}';
    function pad(addr) { return addr.replace('0x', '').toLowerCase().padStart(64, '0'); }
    function uint256Hex(value) { return BigInt(value).toString(16).padStart(64, '0'); }
    function readAmount() {
      return document.getElementById('swap-amount-input').value;
    }
    function readMinOutput() {
      return document.getElementById('slippage-input').value;
    }
    document.getElementById('connect').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      document.getElementById('account').textContent = accounts[0];
    });
    document.getElementById('approve').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      // approve(address,uint256) = 0x095ea7b3
      const data = '0x095ea7b3' + pad(SWAP) + uint256Hex(readAmount());
      try {
        const hash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{ from: accounts[0], to: TOKEN_A, data }],
        });
        document.getElementById('last-tx').textContent = hash;
        document.getElementById('last-error').textContent = '';
      } catch (e) {
        document.getElementById('last-error').textContent = String(e.code) + ':' + String(e.message);
      }
    });
    document.getElementById('swap').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      // swapAforB(uint256,uint256) selector = keccak256("swapAforB(uint256,uint256)")[:4]
      const data = '0x140e6247' + uint256Hex(readAmount()) + uint256Hex(readMinOutput());
      try {
        const hash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{ from: accounts[0], to: SWAP, data }],
        });
        document.getElementById('last-tx').textContent = hash;
        document.getElementById('last-error').textContent = '';
      } catch (e) {
        document.getElementById('last-error').textContent = String(e.code) + ':' + String(e.message);
      }
    });
    document.getElementById('refresh').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      // balanceOf(address) = 0x70a08231
      const bA = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: TOKEN_A, data: '0x70a08231' + pad(accounts[0]) }, 'latest'],
      });
      const bB = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: TOKEN_B, data: '0x70a08231' + pad(accounts[0]) }, 'latest'],
      });
      document.getElementById('balance-a').textContent = BigInt(bA).toString();
      document.getElementById('balance-b').textContent = BigInt(bB).toString();
      // allowance(address,address) = 0xdd62ed3e
      const al = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: TOKEN_A, data: '0xdd62ed3e' + pad(accounts[0]) + pad(SWAP) }, 'latest'],
      });
      document.getElementById('allowance').textContent = BigInt(al).toString();
    });
  </script>
</body>
</html>
  `;
}

test.describe('defi-swap e2e (ERC20 approve → swap)', () => {
  test('T-DS-001 deploy 後 balance-a=USER_INITIAL / balance-b=0 を表示', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const { tokenA, tokenB, swap } = await setupSwap(anvilPort);
    await page.setContent(makeDappHtml(tokenA, tokenB, swap));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#refresh');
    await dappE2e.waitForRpcIdle();
    await expect(page.locator('#balance-a')).toHaveText(USER_INITIAL.toString());
    await expect(page.locator('#balance-b')).toHaveText('0');
    await expect(page.locator('#allowance')).toHaveText('0');
  });

  test('T-DS-002 approve → allowance=SWAP_AMOUNT を表示', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const { tokenA, tokenB, swap } = await setupSwap(anvilPort);
    await page.setContent(makeDappHtml(tokenA, tokenB, swap));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#approve');
    await dappE2e.waitForRpcIdle();
    await page.click('#refresh');
    await dappE2e.waitForRpcIdle();
    await expect(page.locator('#allowance')).toHaveText(SWAP_AMOUNT.toString());
  });

  test('T-DS-003 approve → swap で balance-a が SWAP_AMOUNT 減、balance-b が SWAP_AMOUNT 増', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const { tokenA, tokenB, swap, user } = await setupSwap(anvilPort);
    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });
    await page.setContent(makeDappHtml(tokenA, tokenB, swap));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#approve');
    await dappE2e.waitForRpcIdle();
    await expectBalanceChange(pub, tokenA, user, -SWAP_AMOUNT, async () =>
      expectBalanceChange(pub, tokenB, user, SWAP_AMOUNT, async () => {
        await page.click('#swap');
        await dappE2e.waitForRpcIdle();
      }),
    );
    await page.click('#refresh');
    await dappE2e.waitForRpcIdle();
    await expect(page.locator('#balance-a')).toHaveText(
      (USER_INITIAL - SWAP_AMOUNT).toString(),
    );
    await expect(page.locator('#balance-b')).toHaveText(SWAP_AMOUNT.toString());
    await expect(page.locator('#allowance')).toHaveText('0');
  });

  test('T-DS-005 minOutputAmount を上回る最小受取量を指定すると slippage protection で revert する', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const { tokenA, tokenB, swap, user } = await setupSwap(anvilPort);
    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });
    await page.setContent(makeDappHtml(tokenA, tokenB, swap));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#approve');
    await dappE2e.waitForRpcIdle();
    const minOutputAmount = SWAP_AMOUNT + 1n;
    await page.getByTestId('slippage-input').fill(minOutputAmount.toString());
    try {
      await pub.simulateContract({
        account: user,
        address: swap,
        abi: SWAP_ABI,
        functionName: 'swapAforB',
        args: [SWAP_AMOUNT, minOutputAmount],
      });
      throw new Error('expected SlippageExceeded revert');
    } catch (error) {
      expectCustomError(error, 'SlippageExceeded', [SWAP_AMOUNT, minOutputAmount]);
    }
    await page.click('#swap');
    await dappE2e.waitForRpcIdle();
    await expect(page.locator('#last-error')).not.toHaveText('');
    await page.click('#refresh');
    await dappE2e.waitForRpcIdle();
    await expect(page.locator('#balance-a')).toHaveText(USER_INITIAL.toString());
    await expect(page.locator('#balance-b')).toHaveText('0');
    await expect(page.locator('#allowance')).toHaveText(SWAP_AMOUNT.toString());
  });

  test('T-DS-006 pool 流動性を超える swap を試行すると revert する', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const { tokenA, tokenB, swap, user } = await setupSwap(anvilPort, {
      userInitial: LARGE_USER_INITIAL,
    });
    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });
    await page.setContent(makeDappHtml(tokenA, tokenB, swap));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();

    const poolBalance = await pub.readContract({
      address: tokenB,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [swap],
    });
    const excessiveAmount = poolBalance + 1n;

    await page.getByTestId('swap-amount-input').fill(excessiveAmount.toString());
    await page.click('#approve');
    await dappE2e.waitForRpcIdle();
    try {
      await pub.simulateContract({
        account: user,
        address: swap,
        abi: SWAP_ABI,
        functionName: 'swapAforB',
        args: [excessiveAmount, 0n],
      });
      throw new Error('expected InsufficientLiquidity revert');
    } catch (error) {
      expectCustomError(error, 'InsufficientLiquidity', [excessiveAmount, poolBalance]);
    }
    await page.click('#swap');
    await dappE2e.waitForRpcIdle();

    await expect(page.locator('#last-error')).not.toHaveText('');

    await page.click('#refresh');
    await dappE2e.waitForRpcIdle();
    await expect(page.locator('#balance-a')).toHaveText(LARGE_USER_INITIAL.toString());
    await expect(page.locator('#balance-b')).toHaveText('0');
    await expect(page.locator('#allowance')).toHaveText(excessiveAmount.toString());
  });

  test('T-DS-004 setApprovalMode("reject") で approve が code 4001 reject される', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const { tokenA, tokenB, swap } = await setupSwap(anvilPort);
    await page.setContent(makeDappHtml(tokenA, tokenB, swap));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await dappE2e.setApprovalMode('reject');
    await page.click('#approve');
    await dappE2e.waitForRpcIdle();
    const err = (await page.locator('#last-error').textContent()) ?? '';
    expect(err.startsWith('4001:')).toBe(true);
  });

  test('T-DS-007 startAnvilFork で upstream chain state を fork できる', async () => {
    const upstream = await startAnvil();
    let forkHandle: Awaited<ReturnType<typeof startAnvilFork>> | null = null;

    try {
      const { tokenA, user } = await setupSwap(upstream.port);
      const upstreamPub = createPublicClient({
        chain: anvilChain(upstream.port),
        transport: http(),
      });

      forkHandle = await startAnvilFork({
        forkUrl: `http://127.0.0.1:${upstream.port}`,
      });

      const forkPub = createPublicClient({
        chain: anvilChain(forkHandle.port),
        transport: http(),
      });
      const forkBalance = await forkPub.readContract({
        address: tokenA,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [user],
      });
      expect(forkBalance).toBe(USER_INITIAL);

      const upstreamBalance = await upstreamPub.readContract({
        address: tokenA,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [user],
      });
      expect(upstreamBalance).toBe(USER_INITIAL);
    } finally {
      if (forkHandle) {
        await forkHandle.stop();
      }
      await upstream.stop();
    }
  });
});
