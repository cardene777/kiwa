import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { expect } from '@playwright/test';
import { dappE2eTest } from '@dapp-e2e/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseEther,
  parseAbi,
  type Hex,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const SELLER_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const BUYER_PK =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const nftArtifact = JSON.parse(
  readFileSync(resolve(__dirname, '../forge-out/MarketNft.sol/MarketNft.json'), 'utf8'),
) as { abi: readonly unknown[]; bytecode: { object: Hex } };
const marketArtifact = JSON.parse(
  readFileSync(
    resolve(__dirname, '../forge-out/SimpleMarketplace.sol/SimpleMarketplace.json'),
    'utf8',
  ),
) as { abi: readonly unknown[]; bytecode: { object: Hex } };

const NFT_ABI = parseAbi([
  'function mint(address to) returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function approve(address to, uint256 tokenId)',
  'function balanceOf(address owner) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
]);
const MARKET_ABI = parseAbi([
  'function list(uint256 tokenId, uint256 price)',
  'function buy(uint256 tokenId) payable',
  'function cancel(uint256 tokenId)',
  'function listings(uint256 tokenId) view returns (address seller, uint256 price, bool active)',
  'event Listed(uint256 indexed tokenId, address indexed seller, uint256 price)',
  'event Bought(uint256 indexed tokenId, address indexed buyer, uint256 price)',
]);

function anvilChain(port: number) {
  return defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
}

async function setupMarket(
  port: number,
): Promise<{ nft: Address; market: Address; tokenId: bigint }> {
  const seller = privateKeyToAccount(SELLER_PK);
  const wallet = createWalletClient({
    account: seller,
    chain: anvilChain(port),
    transport: http(),
  });
  const pub = createPublicClient({ chain: anvilChain(port), transport: http() });

  const nftHash = await wallet.deployContract({
    abi: nftArtifact.abi as never,
    bytecode: nftArtifact.bytecode.object,
  });
  const nftReceipt = await pub.waitForTransactionReceipt({ hash: nftHash });
  const nft = nftReceipt.contractAddress!;

  const marketHash = await wallet.deployContract({
    abi: marketArtifact.abi as never,
    bytecode: marketArtifact.bytecode.object,
    args: [nft],
  });
  const marketReceipt = await pub.waitForTransactionReceipt({ hash: marketHash });
  const market = marketReceipt.contractAddress!;

  const mintHash = await wallet.writeContract({
    address: nft,
    abi: NFT_ABI,
    functionName: 'mint',
    args: [seller.address],
  });
  await pub.waitForTransactionReceipt({ hash: mintHash });

  return { nft, market, tokenId: 1n };
}

function makeViewerHtml(nft: Address, market: Address): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>nft-marketplace</title></head>
<body>
  <button id="connect">Connect</button>
  <button id="refresh">Refresh</button>
  <pre id="account"></pre>
  <pre id="token-owner"></pre>
  <pre id="listing-active"></pre>
  <pre id="listing-price"></pre>
  <script>
    const NFT = '${nft}';
    const MARKET = '${market}';
    function pad(addr) { return addr.replace('0x', '').toLowerCase().padStart(64, '0'); }
    document.getElementById('connect').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      document.getElementById('account').textContent = accounts[0];
    });
    document.getElementById('refresh').addEventListener('click', async () => {
      // ownerOf(uint256) sig = 0x6352211e
      const ownerData = '0x6352211e' + '0000000000000000000000000000000000000000000000000000000000000001';
      const ownerRaw = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: NFT, data: ownerData }, 'latest'],
      });
      const owner = '0x' + ownerRaw.slice(26);
      document.getElementById('token-owner').textContent = owner.toLowerCase();
      // listings(uint256) sig = 0xde74e57b (auto-getter for public mapping); use unique signature instead by reading raw
      // To keep simple, compute via short call: listings(uint256)=keccak("listings(uint256)") first 4 bytes
      // Foundry public mapping getter selector: 0xde74e57b
      const listingsData = '0xde74e57b' + '0000000000000000000000000000000000000000000000000000000000000001';
      const listingRaw = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: MARKET, data: listingsData }, 'latest'],
      });
      // 3 fields: address (32 byte slot), uint256 price, bool active
      const hex = listingRaw.slice(2);
      const price = BigInt('0x' + hex.slice(64, 128)).toString();
      const active = BigInt('0x' + hex.slice(128, 192)) === 1n;
      document.getElementById('listing-active').textContent = active ? 'true' : 'false';
      document.getElementById('listing-price').textContent = price;
    });
  </script>
</body>
</html>
  `;
}

dappE2eTest.describe('nft-marketplace e2e', () => {
  dappE2eTest('T-NM-001 seller mint 後 owner=seller を viewer page で確認できる', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const { nft, market, tokenId } = await setupMarket(anvilPort);
    void tokenId;
    const seller = privateKeyToAccount(SELLER_PK);
    await page.setContent(makeViewerHtml(nft, market));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#refresh');
    await dappE2e.waitForRpcIdle();
    expect((await page.locator('#token-owner').textContent())?.toLowerCase()).toBe(
      seller.address.toLowerCase(),
    );
    expect(await page.locator('#listing-active').textContent()).toBe('false');
  });

  dappE2eTest('T-NM-002 seller approve + list 後 listing.active=true / price 表示', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const { nft, market, tokenId } = await setupMarket(anvilPort);
    const seller = privateKeyToAccount(SELLER_PK);
    const wallet = createWalletClient({
      account: seller,
      chain: anvilChain(anvilPort),
      transport: http(),
    });
    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });

    const approveHash = await wallet.writeContract({
      address: nft,
      abi: NFT_ABI,
      functionName: 'approve',
      args: [market, tokenId],
    });
    await pub.waitForTransactionReceipt({ hash: approveHash });

    const listHash = await wallet.writeContract({
      address: market,
      abi: MARKET_ABI,
      functionName: 'list',
      args: [tokenId, parseEther('1')],
    });
    await pub.waitForTransactionReceipt({ hash: listHash });

    await page.setContent(makeViewerHtml(nft, market));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#refresh');
    await dappE2e.waitForRpcIdle();
    expect(await page.locator('#listing-active').textContent()).toBe('true');
    expect(await page.locator('#listing-price').textContent()).toBe(parseEther('1').toString());
  });

  dappE2eTest('T-NM-003 buyer が buy → owner が buyer に移転 + listing.active=false', async ({
    page,
    anvilPort,
    dappE2e,
  }) => {
    const { nft, market, tokenId } = await setupMarket(anvilPort);
    const seller = privateKeyToAccount(SELLER_PK);
    const buyer = privateKeyToAccount(BUYER_PK);
    const sellerWallet = createWalletClient({
      account: seller,
      chain: anvilChain(anvilPort),
      transport: http(),
    });
    const buyerWallet = createWalletClient({
      account: buyer,
      chain: anvilChain(anvilPort),
      transport: http(),
    });
    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });

    await pub.waitForTransactionReceipt({
      hash: await sellerWallet.writeContract({
        address: nft,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [market, tokenId],
      }),
    });
    await pub.waitForTransactionReceipt({
      hash: await sellerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'list',
        args: [tokenId, parseEther('1')],
      }),
    });
    const buyHash = await buyerWallet.writeContract({
      address: market,
      abi: MARKET_ABI,
      functionName: 'buy',
      args: [tokenId],
      value: parseEther('1'),
    });
    await pub.waitForTransactionReceipt({ hash: buyHash });

    await page.setContent(makeViewerHtml(nft, market));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#refresh');
    await dappE2e.waitForRpcIdle();
    expect((await page.locator('#token-owner').textContent())?.toLowerCase()).toBe(
      buyer.address.toLowerCase(),
    );
    expect(await page.locator('#listing-active').textContent()).toBe('false');
  });

  dappE2eTest('T-NM-004 buy で InsufficientPayment が revert', async ({ anvilPort }) => {
    const { nft, market, tokenId } = await setupMarket(anvilPort);
    void nft;
    const seller = privateKeyToAccount(SELLER_PK);
    const buyer = privateKeyToAccount(BUYER_PK);
    const sellerWallet = createWalletClient({
      account: seller,
      chain: anvilChain(anvilPort),
      transport: http(),
    });
    const buyerWallet = createWalletClient({
      account: buyer,
      chain: anvilChain(anvilPort),
      transport: http(),
    });
    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });

    await pub.waitForTransactionReceipt({
      hash: await sellerWallet.writeContract({
        address: nft,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [market, tokenId],
      }),
    });
    await pub.waitForTransactionReceipt({
      hash: await sellerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'list',
        args: [tokenId, parseEther('1')],
      }),
    });

    let reverted = false;
    try {
      await buyerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'buy',
        args: [tokenId],
        value: parseEther('0.5'),
      });
    } catch (e) {
      const msg = (e as Error).message ?? '';
      reverted = msg.includes('InsufficientPayment') || msg.includes('revert');
    }
    expect(reverted).toBe(true);
  });
});
