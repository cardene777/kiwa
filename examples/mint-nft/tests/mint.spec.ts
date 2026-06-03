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
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const artifact = JSON.parse(
  readFileSync(resolve(__dirname, '../forge-out/MintNft.sol/MintNft.json'), 'utf8'),
) as { abi: readonly unknown[]; bytecode: { object: Hex } };

const ABI = parseAbi([
  'function mint(address to) returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function totalSupply() view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
]);

function anvilChain(port: number) {
  return defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
}

async function deployMintNft(port: number): Promise<Hex> {
  const account = privateKeyToAccount(PRIVATE_KEY);
  const wallet = createWalletClient({
    account,
    chain: anvilChain(port),
    transport: http(),
  });
  const pub = createPublicClient({ chain: anvilChain(port), transport: http() });
  const hash = await wallet.deployContract({
    abi: artifact.abi as never,
    bytecode: artifact.bytecode.object,
  });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error('mint-nft deploy failed');
  return receipt.contractAddress;
}

function makeDappHtml(contractAddress: Hex, recipient: Hex): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>mint-nft</title></head>
<body>
  <button id="connect">Connect</button>
  <button id="mint">Mint</button>
  <button id="refresh-balance">RefreshBalance</button>
  <button id="transfer">TransferToRecipient</button>
  <pre id="account"></pre>
  <pre id="last-tx"></pre>
  <pre id="balance"></pre>
  <pre id="recipient-balance"></pre>
  <pre id="last-token-id"></pre>
  <script>
    const CONTRACT = '${contractAddress}';
    const RECIPIENT = '${recipient}';
    // 1-arg method "balanceOf(address)" = 0x70a08231, but ERC721 sig is keccak("balanceOf(address)") = 0x70a08231
    // mint(address) sig = keccak("mint(address)") first 4 bytes = 0x6a627842
    // transferFrom(address,address,uint256) = 0x23b872dd
    function pad(addr) { return addr.replace('0x', '').toLowerCase().padStart(64, '0'); }
    function padU(n) { return BigInt(n).toString(16).padStart(64, '0'); }
    document.getElementById('connect').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      document.getElementById('account').textContent = accounts[0];
    });
    document.getElementById('mint').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const data = '0x6a627842' + pad(accounts[0]);
      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: accounts[0], to: CONTRACT, data }],
      });
      document.getElementById('last-tx').textContent = hash;
    });
    document.getElementById('refresh-balance').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const data = '0x70a08231' + pad(accounts[0]);
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: CONTRACT, data }, 'latest'],
      });
      document.getElementById('balance').textContent = BigInt(result).toString();
      const rdata = '0x70a08231' + pad(RECIPIENT);
      const r = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: CONTRACT, data: rdata }, 'latest'],
      });
      document.getElementById('recipient-balance').textContent = BigInt(r).toString();
    });
    document.getElementById('transfer').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const tokenId = document.getElementById('last-token-id').textContent || '1';
      const data = '0x23b872dd' + pad(accounts[0]) + pad(RECIPIENT) + padU(tokenId);
      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: accounts[0], to: CONTRACT, data }],
      });
      document.getElementById('last-tx').textContent = hash;
    });
  </script>
</body>
</html>
  `;
}

test.describe('mint-nft e2e (ERC721 mint flow)', () => {
  test('T-MN-001 contract deploy + connect で account 表示', async ({ page, anvilPort }) => {
    const contract = await deployMintNft(anvilPort);
    const account = privateKeyToAccount(PRIVATE_KEY);
    await page.setContent(makeDappHtml(contract, RECIPIENT));
    await page.click('#connect');
    const text = await page.locator('#account').textContent({ timeout: 5000 });
    expect(text?.toLowerCase()).toBe(account.address.toLowerCase());
  });

  test('T-MN-002 mint で totalSupply が 1 増え、Transfer event が emit', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const contract = await deployMintNft(anvilPort);
    const account = privateKeyToAccount(PRIVATE_KEY);
    await page.setContent(makeDappHtml(contract, RECIPIENT));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#mint');
    await dappE2e.waitForRpcIdle();
    const txHash = (await page.locator('#last-tx').textContent()) ?? '';
    expect(txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);

    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });
    const receipt = await pub.waitForTransactionReceipt({ hash: txHash as Hex });
    expect(receipt.status).toBe('success');

    const supply = await pub.readContract({
      address: contract,
      abi: ABI,
      functionName: 'totalSupply',
    });
    expect(supply).toBe(1n);

    const owner = await pub.readContract({
      address: contract,
      abi: ABI,
      functionName: 'ownerOf',
      args: [1n],
    });
    expect(owner.toLowerCase()).toBe(account.address.toLowerCase());
  });

  test('T-MN-003 mint 後 RefreshBalance で balance=1 が DOM に反映', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const contract = await deployMintNft(anvilPort);
    await page.setContent(makeDappHtml(contract, RECIPIENT));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#mint');
    await dappE2e.waitForRpcIdle();
    await page.click('#refresh-balance');
    await dappE2e.waitForRpcIdle();
    const balance = await page.locator('#balance').textContent();
    expect(balance).toBe('1');
  });

  test('T-MN-004 mint → transfer で minter balance=0 / recipient balance=1', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const contract = await deployMintNft(anvilPort);
    await page.setContent(makeDappHtml(contract, RECIPIENT));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#mint');
    await dappE2e.waitForRpcIdle();
    await page.locator('#last-token-id').evaluate((el) => (el.textContent = '1'));
    await page.click('#transfer');
    await dappE2e.waitForRpcIdle();
    await page.click('#refresh-balance');
    await dappE2e.waitForRpcIdle();
    expect(await page.locator('#balance').textContent()).toBe('0');
    expect(await page.locator('#recipient-balance').textContent()).toBe('1');
  });
});
