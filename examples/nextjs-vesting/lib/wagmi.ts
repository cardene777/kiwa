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
  rpcUrls: { default: { http: [`http://127.0.0.1:${ANVIL_PORT}`] } },
});

const connectors = connectorsForWallets(
  [{ groupName: 'Browser', wallets: [injectedWallet] }],
  {
    appName: 'dapp-e2e nextjs-vesting',
    projectId: '00000000000000000000000000000000',
  },
);

export const wagmiConfig = createConfig({
  chains: [anvilChain],
  connectors,
  transports: { [anvilChain.id]: http() },
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

export const VEST_TOKEN = requireEnv(process.env.NEXT_PUBLIC_VEST_TOKEN, 'NEXT_PUBLIC_VEST_TOKEN');
export const VESTING = requireEnv(process.env.NEXT_PUBLIC_VESTING, 'NEXT_PUBLIC_VESTING');

export const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const VESTING_ABI = [
  {
    inputs: [],
    name: 'releasable',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'released',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'total',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint64', name: 'timestamp', type: 'uint64' }],
    name: 'vestedAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'release',
    outputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cliff',
    outputs: [{ internalType: 'uint64', name: '', type: 'uint64' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'start',
    outputs: [{ internalType: 'uint64', name: '', type: 'uint64' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'duration',
    outputs: [{ internalType: 'uint64', name: '', type: 'uint64' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
