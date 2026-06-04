'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

const ANVIL_PORT = Number(process.env.NEXT_PUBLIC_ANVIL_PORT ?? 8545);

export const anvilChain = defineChain({
  id: 31337,
  name: 'Anvil',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [`http://127.0.0.1:${ANVIL_PORT}`] },
  },
});

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Browser',
      wallets: [injectedWallet],
    },
  ],
  {
    appName: 'dapp-e2e nextjs-erc1155-game',
    projectId: '00000000000000000000000000000000',
  },
);

export const wagmiConfig = createConfig({
  chains: [anvilChain],
  connectors,
  transports: {
    [anvilChain.id]: http(),
  },
  ssr: true,
});

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

function requireEnv(value: string | undefined, name: string): `0x${string}` {
  if (value) {
    return value as `0x${string}`;
  }

  if (process.env.NEXT_PUBLIC_RUNTIME_MODE === 'test') {
    throw new Error(
      `${name} is required (set by tests/prepare-env.ts before pnpm build). ` +
        `Did webServer.command run prepare-env first?`,
    );
  }

  console.warn(
    `[wagmi] ${name} is not set; using zero-address fallback because NEXT_PUBLIC_RUNTIME_MODE !== 'test'.`,
  );
  return ZERO_ADDRESS;
}

export const CONTRACT_ADDRESS = requireEnv(
  process.env.NEXT_PUBLIC_GAME_CONTRACT,
  'NEXT_PUBLIC_GAME_CONTRACT',
);

export const GAME_ITEMS_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
    ],
    name: 'mintBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'address', name: 'owner', type: 'address' },
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address[]', name: 'owners', type: 'address[]' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
    ],
    name: 'balanceOfBatch',
    outputs: [{ internalType: 'uint256[]', name: 'result', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
    ],
    name: 'safeBatchTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const ITEM_IDS = [1n, 2n, 3n] as const;
export const ITEM_NAMES = ['Sword', 'Shield', 'Potion'] as const;
