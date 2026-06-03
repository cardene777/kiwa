import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { expect } from '@playwright/test';
import { dappE2eTest as test } from '@dapp-e2e/core';
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
  'function swapAforB(uint256 amountIn)',
  'event Swapped(address indexed user, uint256 amountIn, uint256 amountOut)',
]);

const POOL_LIQUIDITY = 1000n * 10n ** 18n;
const USER_INITIAL = 100n * 10n ** 18n;
const SWAP_AMOUNT = 25n * 10n ** 18n;

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
): Promise<{
  tokenA: Address;
  tokenB: Address;
  swap: Address;
  user: Address;
}> {
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
    args: ['TokenA', 'TKA', USER_INITIAL, account.address],
  });
  const aReceipt = await pub.waitForTransactionReceipt({ hash: aHash });
  const tokenA = aReceipt.contractAddress!;

  // deploy TokenB: mint POOL_LIQUIDITY to deployer (then transfer to swap pool)
  const bHash = await wallet.deployContract({
    abi: erc20Artifact.abi as never,
    bytecode: erc20Artifact.bytecode.object,
    args: ['TokenB', 'TKB', POOL_LIQUIDITY, account.address],
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
    args: [swap, POOL_LIQUIDITY],
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
    const AMOUNT_HEX = '${SWAP_AMOUNT.toString(16).padStart(64, '0')}';
    function pad(addr) { return addr.replace('0x', '').toLowerCase().padStart(64, '0'); }
    document.getElementById('connect').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      document.getElementById('account').textContent = accounts[0];
    });
    document.getElementById('approve').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      // approve(address,uint256) = 0x095ea7b3
      const data = '0x095ea7b3' + pad(SWAP) + AMOUNT_HEX;
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
      // swapAforB(uint256) selector = keccak256("swapAforB(uint256)")[:4]
      const data = '0xe4f1f70a' + AMOUNT_HEX;
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
    expect(await page.locator('#balance-a').textContent()).toBe(USER_INITIAL.toString());
    expect(await page.locator('#balance-b').textContent()).toBe('0');
    expect(await page.locator('#allowance').textContent()).toBe('0');
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
    expect(await page.locator('#allowance').textContent()).toBe(SWAP_AMOUNT.toString());
  });

  test('T-DS-003 approve → swap で balance-a が SWAP_AMOUNT 減、balance-b が SWAP_AMOUNT 増', async ({
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
    await page.click('#swap');
    await dappE2e.waitForRpcIdle();
    await page.click('#refresh');
    await dappE2e.waitForRpcIdle();
    expect(await page.locator('#balance-a').textContent()).toBe(
      (USER_INITIAL - SWAP_AMOUNT).toString(),
    );
    expect(await page.locator('#balance-b').textContent()).toBe(SWAP_AMOUNT.toString());
    expect(await page.locator('#allowance').textContent()).toBe('0');
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
});
