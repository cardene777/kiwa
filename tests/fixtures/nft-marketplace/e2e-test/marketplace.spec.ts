import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { expect } from '@playwright/test';
import { dappE2eTest } from '@kiwa/core';
import { expectCustomError, increaseTime } from '@kiwa/core';
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
const ROYALTY_PK =
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' as const;
const COUNTER_BUYER_PK =
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6' as const;

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
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  'function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address receiver, uint256 royaltyAmount)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
]);
const MARKET_ABI = parseAbi([
  'function list(uint256 tokenId, uint256 price)',
  'function buy(uint256 tokenId) payable',
  'function buyNft(uint256 tokenId) payable',
  'function cancel(uint256 tokenId)',
  'function makeOffer(uint256 tokenId, uint256 amount, uint256 deadline) payable returns (uint256)',
  'function cancelOffer(uint256 offerId)',
  'function acceptOffer(uint256 offerId)',
  'function listings(uint256 tokenId) view returns (address seller, uint256 price, bool active)',
  'function offers(uint256 offerId) view returns (uint256 tokenId, address buyer, uint256 amount, uint256 deadline, bool active)',
  'function isOfferActive(uint256 offerId) view returns (bool)',
  'error InsufficientPayment()',
  'error AlreadyListed(uint256 tokenId)',
  'error OfferExpired(uint256 offerId)',
  'event Listed(uint256 indexed tokenId, address indexed seller, uint256 price)',
  'event Bought(uint256 indexed tokenId, address indexed buyer, uint256 price)',
]);

const INTERFACE_IDS = {
  erc165: '0x01ffc9a7',
  erc721: '0x80ac58cd',
  erc721Metadata: '0x5b5e139f',
  erc2981: '0x2a55205a',
} as const;

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
  const royaltyReceiver = privateKeyToAccount(ROYALTY_PK);
  const wallet = createWalletClient({
    account: seller,
    chain: anvilChain(port),
    transport: http(),
  });
  const pub = createPublicClient({ chain: anvilChain(port), transport: http() });

  const nftHash = await wallet.deployContract({
    abi: nftArtifact.abi as never,
    bytecode: nftArtifact.bytecode.object,
    args: [royaltyReceiver.address],
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
      const ownerData = '0x6352211e' + '0000000000000000000000000000000000000000000000000000000000000001';
      const ownerRaw = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: NFT, data: ownerData }, 'latest'],
      });
      const owner = '0x' + ownerRaw.slice(26);
      document.getElementById('token-owner').textContent = owner.toLowerCase();

      const listingsData = '0xde74e57b' + '0000000000000000000000000000000000000000000000000000000000000001';
      const listingRaw = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: MARKET, data: listingsData }, 'latest'],
      });
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
    const { nft, market } = await setupMarket(anvilPort);
    const seller = privateKeyToAccount(SELLER_PK);
    await page.setContent(makeViewerHtml(nft, market));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#refresh');
    await dappE2e.waitForRpcIdle();
    await expect(page.locator('#token-owner')).toHaveText(seller.address.toLowerCase());
    await expect(page.locator('#listing-active')).toHaveText('false');
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
    await expect(page.locator('#listing-active')).toHaveText('true');
    await expect(page.locator('#listing-price')).toHaveText(parseEther('1').toString());
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
    await expect(page.locator('#token-owner')).toHaveText(buyer.address.toLowerCase());
    await expect(page.locator('#listing-active')).toHaveText('false');
  });

  dappE2eTest('T-NM-004 buy で InsufficientPayment が revert', async ({ anvilPort }) => {
    const { nft, market, tokenId } = await setupMarket(anvilPort);
    const seller = privateKeyToAccount(SELLER_PK);
    const buyer = privateKeyToAccount(BUYER_PK);
    const sellerWallet = createWalletClient({
      account: seller,
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

    try {
      await pub.simulateContract({
        account: buyer.address,
        address: market,
        abi: MARKET_ABI,
        functionName: 'buy',
        args: [tokenId],
        value: parseEther('0.5'),
      });
      throw new Error('expected InsufficientPayment revert');
    } catch (error) {
      expectCustomError(error, 'InsufficientPayment');
    }
  });

  dappE2eTest('T-NM-005 同一 tokenId の double-listing は AlreadyListed(uint256) で revert', async ({
    anvilPort,
  }) => {
    const { nft, market, tokenId } = await setupMarket(anvilPort);
    const seller = privateKeyToAccount(SELLER_PK);
    const sellerWallet = createWalletClient({
      account: seller,
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

    try {
      await pub.simulateContract({
        account: seller.address,
        address: market,
        abi: MARKET_ABI,
        functionName: 'list',
        args: [tokenId, parseEther('1')],
      });
      throw new Error('expected AlreadyListed revert');
    } catch (error) {
      expectCustomError(error, 'AlreadyListed', [tokenId]);
    }
  });

  dappE2eTest('T-NM-006 makeOffer → cancelOffer で offer が消え marketplace balance が 0 に戻る', async ({
    anvilPort,
  }) => {
    const { market, tokenId } = await setupMarket(anvilPort);
    const buyer = privateKeyToAccount(BUYER_PK);
    const buyerWallet = createWalletClient({
      account: buyer,
      chain: anvilChain(anvilPort),
      transport: http(),
    });
    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });
    const deadline = (await pub.getBlock()).timestamp + 3600n;

    await pub.waitForTransactionReceipt({
      hash: await buyerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'makeOffer',
        args: [tokenId, parseEther('1'), deadline],
        value: parseEther('1'),
      }),
    });

    const marketBalanceBeforeCancel = await pub.getBalance({ address: market });
    expect(marketBalanceBeforeCancel).toBe(parseEther('1'));

    await pub.waitForTransactionReceipt({
      hash: await buyerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'cancelOffer',
        args: [1n],
      }),
    });

    const offer = await pub.readContract({
      address: market,
      abi: MARKET_ABI,
      functionName: 'offers',
      args: [1n],
    });
    expect(offer[4]).toBe(false);
    expect(await pub.getBalance({ address: market })).toBe(0n);
  });

  dappE2eTest('T-NM-007 offer / counter-offer の後 seller が counter-offer を accept できる', async ({
    anvilPort,
  }) => {
    const { nft, market, tokenId } = await setupMarket(anvilPort);
    const seller = privateKeyToAccount(SELLER_PK);
    const buyer = privateKeyToAccount(BUYER_PK);
    const counterBuyer = privateKeyToAccount(COUNTER_BUYER_PK);
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
    const counterBuyerWallet = createWalletClient({
      account: counterBuyer,
      chain: anvilChain(anvilPort),
      transport: http(),
    });
    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });
    const deadline = (await pub.getBlock()).timestamp + 3600n;

    await pub.waitForTransactionReceipt({
      hash: await sellerWallet.writeContract({
        address: nft,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [market, tokenId],
      }),
    });
    await pub.waitForTransactionReceipt({
      hash: await buyerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'makeOffer',
        args: [tokenId, parseEther('1'), deadline],
        value: parseEther('1'),
      }),
    });
    await pub.waitForTransactionReceipt({
      hash: await counterBuyerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'makeOffer',
        args: [tokenId, parseEther('1.1'), deadline],
        value: parseEther('1.1'),
      }),
    });

    await pub.waitForTransactionReceipt({
      hash: await sellerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'acceptOffer',
        args: [2n],
      }),
    });

    const owner = await pub.readContract({
      address: nft,
      abi: NFT_ABI,
      functionName: 'ownerOf',
      args: [tokenId],
    });
    expect(owner.toLowerCase()).toBe(counterBuyer.address.toLowerCase());
  });

  dappE2eTest('T-NM-008 期限切れ offer は isOfferActive=false になり acceptOffer が OfferExpired(uint256) で revert', async ({
    anvilPort,
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
    const deadline = (await pub.getBlock()).timestamp + 1n;

    await pub.waitForTransactionReceipt({
      hash: await sellerWallet.writeContract({
        address: nft,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [market, tokenId],
      }),
    });
    await pub.waitForTransactionReceipt({
      hash: await buyerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'makeOffer',
        args: [tokenId, parseEther('1'), deadline],
        value: parseEther('1'),
      }),
    });

    await increaseTime(pub, 2n);

    const active = await pub.readContract({
      address: market,
      abi: MARKET_ABI,
      functionName: 'isOfferActive',
      args: [1n],
    });
    expect(active).toBe(false);

    try {
      await pub.simulateContract({
        account: seller.address,
        address: market,
        abi: MARKET_ABI,
        functionName: 'acceptOffer',
        args: [1n],
      });
      throw new Error('expected OfferExpired revert');
    } catch (error) {
      expectCustomError(error, 'OfferExpired', [1n]);
    }
  });

  dappE2eTest('T-NM-009 buyNft 後 royalty receiver と seller に split distribution される', async ({
    anvilPort,
  }) => {
    const { nft, market, tokenId } = await setupMarket(anvilPort);
    const seller = privateKeyToAccount(SELLER_PK);
    const buyer = privateKeyToAccount(BUYER_PK);
    const royaltyReceiver = privateKeyToAccount(ROYALTY_PK);
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
    const salePrice = parseEther('1');

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
        args: [tokenId, salePrice],
      }),
    });

    const [, royaltyAmount] = await pub.readContract({
      address: nft,
      abi: NFT_ABI,
      functionName: 'royaltyInfo',
      args: [tokenId, salePrice],
    });
    const sellerBalanceBefore = await pub.getBalance({ address: seller.address });
    const royaltyBalanceBefore = await pub.getBalance({ address: royaltyReceiver.address });

    await pub.waitForTransactionReceipt({
      hash: await buyerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'buyNft',
        args: [tokenId],
        value: salePrice,
      }),
    });

    const sellerBalanceAfter = await pub.getBalance({ address: seller.address });
    const royaltyBalanceAfter = await pub.getBalance({ address: royaltyReceiver.address });

    expect(royaltyBalanceAfter - royaltyBalanceBefore).toBe(royaltyAmount);
    expect(sellerBalanceAfter - sellerBalanceBefore).toBe(salePrice - royaltyAmount);
  });

  dappE2eTest('T-NM-010 MarketNft supportsInterface が ERC165 / ERC721 / metadata / EIP-2981 を返す', async ({
    anvilPort,
  }) => {
    const { nft } = await setupMarket(anvilPort);
    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });

    for (const interfaceId of Object.values(INTERFACE_IDS)) {
      const supported = await pub.readContract({
        address: nft,
        abi: NFT_ABI,
        functionName: 'supportsInterface',
        args: [interfaceId],
      });
      expect(supported).toBe(true);
    }
  });

  dappE2eTest('T-NM-011 offer A accept 時に競合 offer B が refund され inactive になる', async ({
    anvilPort,
  }) => {
    const { nft, market, tokenId } = await setupMarket(anvilPort);
    const seller = privateKeyToAccount(SELLER_PK);
    const buyer = privateKeyToAccount(BUYER_PK);
    const counterBuyer = privateKeyToAccount(COUNTER_BUYER_PK);
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
    const counterBuyerWallet = createWalletClient({
      account: counterBuyer,
      chain: anvilChain(anvilPort),
      transport: http(),
    });
    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });
    const deadline = (await pub.getBlock()).timestamp + 3600n;
    const offerAmountA = parseEther('1');
    const offerAmountB = parseEther('1.1');

    await pub.waitForTransactionReceipt({
      hash: await sellerWallet.writeContract({
        address: nft,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [market, tokenId],
      }),
    });
    await pub.waitForTransactionReceipt({
      hash: await buyerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'makeOffer',
        args: [tokenId, offerAmountA, deadline],
        value: offerAmountA,
      }),
    });
    await pub.waitForTransactionReceipt({
      hash: await counterBuyerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'makeOffer',
        args: [tokenId, offerAmountB, deadline],
        value: offerAmountB,
      }),
    });

    const counterBuyerBalanceAfterOffer = await pub.getBalance({ address: counterBuyer.address });

    await pub.waitForTransactionReceipt({
      hash: await sellerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'acceptOffer',
        args: [1n],
      }),
    });

    const owner = await pub.readContract({
      address: nft,
      abi: NFT_ABI,
      functionName: 'ownerOf',
      args: [tokenId],
    });
    const counterBuyerBalanceAfterAccept = await pub.getBalance({ address: counterBuyer.address });
    const competingOffer = await pub.readContract({
      address: market,
      abi: MARKET_ABI,
      functionName: 'offers',
      args: [2n],
    });
    const competingOfferActive = await pub.readContract({
      address: market,
      abi: MARKET_ABI,
      functionName: 'isOfferActive',
      args: [2n],
    });

    expect(owner.toLowerCase()).toBe(buyer.address.toLowerCase());
    expect(counterBuyerBalanceAfterAccept - counterBuyerBalanceAfterOffer).toBe(offerAmountB);
    expect(competingOffer[4]).toBe(false);
    expect(competingOfferActive).toBe(false);
    expect(await pub.getBalance({ address: market })).toBe(0n);
  });

  dappE2eTest('T-NM-012 buyNft 時に既存 offer が refund され inactive になる', async ({
    anvilPort,
  }) => {
    const { nft, market, tokenId } = await setupMarket(anvilPort);
    const seller = privateKeyToAccount(SELLER_PK);
    const buyer = privateKeyToAccount(BUYER_PK);
    const counterBuyer = privateKeyToAccount(COUNTER_BUYER_PK);
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
    const counterBuyerWallet = createWalletClient({
      account: counterBuyer,
      chain: anvilChain(anvilPort),
      transport: http(),
    });
    const pub = createPublicClient({ chain: anvilChain(anvilPort), transport: http() });
    const deadline = (await pub.getBlock()).timestamp + 3600n;
    const listingPrice = parseEther('1');
    const offerAmount = parseEther('0.9');

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
        args: [tokenId, listingPrice],
      }),
    });
    await pub.waitForTransactionReceipt({
      hash: await buyerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'makeOffer',
        args: [tokenId, offerAmount, deadline],
        value: offerAmount,
      }),
    });

    const buyerBalanceAfterOffer = await pub.getBalance({ address: buyer.address });

    await pub.waitForTransactionReceipt({
      hash: await counterBuyerWallet.writeContract({
        address: market,
        abi: MARKET_ABI,
        functionName: 'buyNft',
        args: [tokenId],
        value: listingPrice,
      }),
    });

    const owner = await pub.readContract({
      address: nft,
      abi: NFT_ABI,
      functionName: 'ownerOf',
      args: [tokenId],
    });
    const buyerBalanceAfterBuy = await pub.getBalance({ address: buyer.address });
    const offer = await pub.readContract({
      address: market,
      abi: MARKET_ABI,
      functionName: 'offers',
      args: [1n],
    });
    const offerActive = await pub.readContract({
      address: market,
      abi: MARKET_ABI,
      functionName: 'isOfferActive',
      args: [1n],
    });

    expect(owner.toLowerCase()).toBe(counterBuyer.address.toLowerCase());
    expect(buyerBalanceAfterBuy - buyerBalanceAfterOffer).toBe(offerAmount);
    expect(offer[4]).toBe(false);
    expect(offerActive).toBe(false);
    expect(await pub.getBalance({ address: market })).toBe(0n);
  });
});
