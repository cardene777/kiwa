'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { defineChain, parseAbiItem } from 'viem';

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
    appName: 'dapp-e2e nextjs-event-history',
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

export const EMITTER = requireEnv(process.env.NEXT_PUBLIC_EMITTER, 'NEXT_PUBLIC_EMITTER');

export const EMITTER_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'value', type: 'uint256' },
      { internalType: 'string', name: 'message', type: 'string' },
    ],
    name: 'emitLog',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalLogs',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const LOGGED_EVENT = parseAbiItem(
  'event Logged(address indexed sender, uint256 indexed value, string message)',
);
