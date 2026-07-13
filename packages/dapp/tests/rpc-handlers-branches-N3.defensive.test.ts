import { describe, expect, it } from 'vitest';
import {
  handleRpcRequest,
  type RpcContext,
} from '../src/index.js';
import type { Hex } from '../src/types.js';

const PK: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

function ctx(overrides: Partial<RpcContext> = {}): RpcContext {
  return {
    privateKey: PK,
    chainState: { current: 31337 },
    ...overrides,
  };
}

describe('rpc-handlers residual defensive branches', () => {
  it('eth_chainId returns hex-formatted current chain state', async () => {
    const result = await handleRpcRequest(ctx(), { method: 'eth_chainId' });
    expect(result).toBe('0x7a69');
  });

  it('net_version returns decimal-string current chain state', async () => {
    const result = await handleRpcRequest(ctx(), { method: 'net_version' });
    expect(result).toBe('31337');
  });

  it('eth_requestAccounts with no accounts and no contract account returns [account.address]', async () => {
    const result = (await handleRpcRequest(ctx(), {
      method: 'eth_requestAccounts',
    })) as string[];
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it('eth_accounts with empty accounts array falls back to [account.address]', async () => {
    const result = (await handleRpcRequest(
      ctx({ accounts: [] }),
      { method: 'eth_accounts' },
    )) as string[];
    expect(result).toHaveLength(1);
  });

  it('eth_accounts with contractAccount returns contract address', async () => {
    const contractAddr = '0x1234567890123456789012345678901234567890' as Hex;
    const result = (await handleRpcRequest(
      ctx({
        contractAccount: {
          address: contractAddr,
          executeAbi: ['function execute(address,uint256,bytes)'],
        },
      }),
      { method: 'eth_accounts' },
    )) as string[];
    expect(result[0]).toBe(contractAddr);
  });

  it('wallet_switchEthereumChain updates chainState.current to parsed hex chainId', async () => {
    const c = ctx({
      chainState: { current: 31337 },
      chainRegistry: {
        current: [
          {
            chainId: '0x1',
            chainName: 'ethereum',
            rpcUrls: ['https://mainnet.example.com'],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          },
        ],
      },
    });
    await handleRpcRequest(c, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }],
    });
    expect(c.chainState.current).toBe(1);
  });

  it('wallet_addEthereumChain appends chain to registry when chainId is new', async () => {
    const c = ctx({
      chainState: { current: 31337 },
      chainRegistry: { current: [] },
    });
    await handleRpcRequest(c, {
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0xa',
          chainName: 'op',
          rpcUrls: ['https://mainnet.optimism.io'],
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        },
      ],
    });
    expect(c.chainRegistry?.current).toHaveLength(1);
    expect(c.chainState.current).toBe(10);
  });

  it('wallet_addEthereumChain overwrites existing entry with matching chainId', async () => {
    const c = ctx({
      chainState: { current: 31337 },
      chainRegistry: {
        current: [
          {
            chainId: '0x1',
            chainName: 'old-eth',
            rpcUrls: ['https://old.example.com'],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          },
        ],
      },
    });
    await handleRpcRequest(c, {
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x1',
          chainName: 'new-eth',
          rpcUrls: ['https://new.example.com'],
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        },
      ],
    });
    expect(c.chainRegistry?.current).toHaveLength(1);
    expect(c.chainRegistry?.current[0]?.chainName).toBe('new-eth');
  });

  it('eth_sendTransaction throws when anvilPort is missing', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'eth_sendTransaction',
        params: [{ from: '0xdead', to: '0xbeef', value: '0x0' }],
      }),
    ).rejects.toThrow(/requires anvilPort/);
  });
});
