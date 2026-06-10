import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { expect } from '@playwright/test';
import { dappE2eTest as test, expectCustomError } from '@kiwa-test/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseAbi,
  parseEther,
  type Address,
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
  'function batchMint(address to, uint256 count) returns (uint256[])',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenByIndex(uint256 index) view returns (uint256)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function totalSupply() view returns (uint256)',
  'function MAX_SUPPLY() view returns (uint256)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  'function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address receiver, uint256 royaltyAmount)',
  'error MaxSupplyReached(uint256 maxSupply)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
]);

const INTERFACE_IDS = {
  erc165: '0x01ffc9a7',
  erc721: '0x80ac58cd',
  erc721Enumerable: '0x780e9d63',
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

function makeClients(port: number, account = privateKeyToAccount(PRIVATE_KEY)) {
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
    const { account, pub } = makeClients(anvilPort);
    await page.setContent(makeDappHtml(contract, RECIPIENT));
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#mint');
    await dappE2e.waitForRpcIdle();
    const txHash = (await page.locator('#last-tx').textContent()) ?? '';
    expect(txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);

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

  test('T-MN-003 batchMint(addr, 3) で 3 NFT が mint され、owner enumerate が連番になる', async ({
    anvilPort,
  }) => {
    const contract = await deployMintNft(anvilPort);
    const { account, wallet, pub } = makeClients(anvilPort);

    const mintHash = await wallet.writeContract({
      address: contract,
      abi: ABI,
      functionName: 'batchMint',
      args: [account.address, 3n],
    });
    await pub.waitForTransactionReceipt({ hash: mintHash });

    const balance = await pub.readContract({
      address: contract,
      abi: ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });
    expect(balance).toBe(3n);

    const supply = await pub.readContract({
      address: contract,
      abi: ABI,
      functionName: 'totalSupply',
    });
    expect(supply).toBe(3n);

    const enumerated = await Promise.all(
      [0n, 1n, 2n].map((index) =>
        pub.readContract({
          address: contract,
          abi: ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [account.address, index],
        }),
      ),
    );
    expect(enumerated).toEqual([1n, 2n, 3n]);
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
    await expect(page.locator('#balance')).toHaveText('0');
    await expect(page.locator('#recipient-balance')).toHaveText('1');
  });

  test('T-MN-005 MAX_SUPPLY 到達後の mint は MaxSupplyReached(uint256) で revert', async ({
    anvilPort,
  }) => {
    const contract = await deployMintNft(anvilPort);
    const { account, wallet, pub } = makeClients(anvilPort);

    const maxSupply = await pub.readContract({
      address: contract,
      abi: ABI,
      functionName: 'MAX_SUPPLY',
    });

    for (let i = 0; i < Number(maxSupply); i++) {
      const hash = await wallet.writeContract({
        address: contract,
        abi: ABI,
        functionName: 'mint',
        args: [account.address],
      });
      await pub.waitForTransactionReceipt({ hash });
    }

    try {
      await pub.simulateContract({
        account: account.address,
        address: contract as Address,
        abi: ABI,
        functionName: 'mint',
        args: [account.address],
      });
      throw new Error('expected MaxSupplyReached revert');
    } catch (error) {
      expectCustomError(error, 'MaxSupplyReached', [maxSupply]);
    }
  });

  test('T-MN-006 royaltyInfo(1, 1 ether) は deployer receiver と 5% royalty を返す', async ({
    anvilPort,
  }) => {
    const contract = await deployMintNft(anvilPort);
    const { account, pub } = makeClients(anvilPort);

    const [receiver, royaltyAmount] = await pub.readContract({
      address: contract,
      abi: ABI,
      functionName: 'royaltyInfo',
      args: [1n, parseEther('1')],
    });

    expect(receiver.toLowerCase()).toBe(account.address.toLowerCase());
    expect(royaltyAmount).toBe(parseEther('0.05'));
  });

  test('T-MN-007 supportsInterface が ERC165 / ERC721 / ERC721Enumerable / EIP-2981 を返す', async ({
    anvilPort,
  }) => {
    const contract = await deployMintNft(anvilPort);
    const { pub } = makeClients(anvilPort);

    for (const interfaceId of Object.values(INTERFACE_IDS)) {
      const supported = await pub.readContract({
        address: contract,
        abi: ABI,
        functionName: 'supportsInterface',
        args: [interfaceId],
      });
      expect(supported).toBe(true);
    }
  });

  test('T-MN-008 batchMint の extreme count は MaxSupplyReached(uint256) で revert', async ({
    anvilPort,
  }) => {
    const contract = await deployMintNft(anvilPort);
    const { account, pub } = makeClients(anvilPort);
    const maxSupply = await pub.readContract({
      address: contract,
      abi: ABI,
      functionName: 'MAX_SUPPLY',
    });
    const extremeCount = (1n << 256n) - 1n;

    try {
      await pub.simulateContract({
        account: account.address,
        address: contract as Address,
        abi: ABI,
        functionName: 'batchMint',
        args: [account.address, extremeCount],
      });
      throw new Error('expected MaxSupplyReached revert');
    } catch (error) {
      expectCustomError(error, 'MaxSupplyReached', [maxSupply]);
    }
  });
});
