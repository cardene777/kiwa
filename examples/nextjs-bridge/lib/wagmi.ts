'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

const L1_PORT = Number(process.env.NEXT_PUBLIC_L1_PORT ?? 8554);
const L2_PORT = Number(process.env.NEXT_PUBLIC_L2_PORT ?? 8555);

export const l1Sim = defineChain({
  id: 1,
  name: 'L1 (sim)',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [`http://127.0.0.1:${L1_PORT}`] } },
});

export const l2Sim = defineChain({
  id: 10,
  name: 'L2 (sim)',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [`http://127.0.0.1:${L2_PORT}`] } },
});

const connectors = connectorsForWallets(
  [{ groupName: 'Browser', wallets: [injectedWallet] }],
  {
    appName: 'dapp-e2e nextjs-bridge',
    projectId: '00000000000000000000000000000000',
  },
);

export const wagmiConfig = createConfig({
  chains: [l1Sim, l2Sim],
  connectors,
  transports: {
    [l1Sim.id]: http(),
    [l2Sim.id]: http(),
  },
  ssr: true,
});

export const SOURCE_TOKEN =
  (process.env.NEXT_PUBLIC_SOURCE_TOKEN as `0x${string}` | undefined) ??
  '0x0000000000000000000000000000000000000000';
export const SOURCE_BRIDGE =
  (process.env.NEXT_PUBLIC_SOURCE_BRIDGE as `0x${string}` | undefined) ??
  '0x0000000000000000000000000000000000000000';
export const DEST_TOKEN =
  (process.env.NEXT_PUBLIC_DEST_TOKEN as `0x${string}` | undefined) ??
  '0x0000000000000000000000000000000000000000';
export const DEST_BRIDGE =
  (process.env.NEXT_PUBLIC_DEST_BRIDGE as `0x${string}` | undefined) ??
  '0x0000000000000000000000000000000000000000';

export const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
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

export const SOURCE_BRIDGE_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'address', name: 'l2Recipient', type: 'address' },
    ],
    name: 'bridgeLock',
    outputs: [{ internalType: 'uint256', name: 'currentNonce', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nonce',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const DEST_BRIDGE_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'address', name: 'l1Recipient', type: 'address' },
    ],
    name: 'bridgeBurn',
    outputs: [{ internalType: 'uint256', name: 'currentNonce', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const BRIDGE_AMOUNT = 50n * 10n ** 18n;
