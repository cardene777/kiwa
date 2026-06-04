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
    appName: 'dapp-e2e nextjs-dao-vote',
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

export const VOTE_TOKEN = requireEnv(process.env.NEXT_PUBLIC_VOTE_TOKEN, 'NEXT_PUBLIC_VOTE_TOKEN');
export const DAO = requireEnv(process.env.NEXT_PUBLIC_DAO, 'NEXT_PUBLIC_DAO');
export const DAO_EXECUTION_TARGET = requireEnv(
  process.env.NEXT_PUBLIC_DAO_EXECUTION_TARGET,
  'NEXT_PUBLIC_DAO_EXECUTION_TARGET',
);

export const VOTE_TOKEN_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'to', type: 'address' }],
    name: 'delegate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'getVotes',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const DAO_ABI = [
  {
    inputs: [{ internalType: 'string', name: 'description', type: 'string' }],
    name: 'propose',
    outputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'uint8', name: 'support', type: 'uint8' },
    ],
    name: 'castVote',
    outputs: [{ internalType: 'uint256', name: 'weight', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    name: 'state',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    name: 'proposalView',
    outputs: [
      { internalType: 'address', name: 'proposer', type: 'address' },
      { internalType: 'uint256', name: 'startBlock', type: 'uint256' },
      { internalType: 'uint256', name: 'endBlock', type: 'uint256' },
      { internalType: 'uint256', name: 'forVotes', type: 'uint256' },
      { internalType: 'uint256', name: 'againstVotes', type: 'uint256' },
      { internalType: 'uint256', name: 'abstainVotes', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proposalCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const STATE_LABEL = ['Pending', 'Active', 'Defeated', 'Succeeded', 'Queued', 'Executed'] as const;
