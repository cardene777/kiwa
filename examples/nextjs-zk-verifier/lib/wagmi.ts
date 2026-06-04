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
    appName: 'dapp-e2e nextjs-zk-verifier',
    projectId: '00000000000000000000000000000000',
  },
);

export const wagmiConfig = createConfig({
  chains: [anvilChain],
  connectors,
  transports: { [anvilChain.id]: http() },
  ssr: true,
});

function requireEnv(value: string | undefined, name: string): `0x${string}` {
  if (!value) {
    throw new Error(
      `${name} is required (set by tests/prepare-env.ts before pnpm build). ` +
        `Did webServer.command run prepare-env first?`,
    );
  }
  return value as `0x${string}`;
}

export const VERIFIER = requireEnv(process.env.NEXT_PUBLIC_VERIFIER, 'NEXT_PUBLIC_VERIFIER');

export const VERIFIER_ABI = [
  {
    inputs: [{ internalType: 'bytes32', name: 'commitment', type: 'bytes32' }],
    name: 'setCommitment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'secret', type: 'bytes32' },
      { internalType: 'string', name: 'message', type: 'string' },
    ],
    name: 'verify',
    outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'who', type: 'address' }],
    name: 'commitments',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'who', type: 'address' }],
    name: 'verifiedCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalVerified',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
