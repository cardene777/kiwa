'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

const MAINNET_PORT = Number(process.env.NEXT_PUBLIC_MAINNET_PORT ?? 8551);
const OPTIMISM_PORT = Number(process.env.NEXT_PUBLIC_OPTIMISM_PORT ?? 8552);
const BASE_PORT = Number(process.env.NEXT_PUBLIC_BASE_PORT ?? 8553);

export const mainnetSim = defineChain({
  id: 1,
  name: 'Mainnet (sim)',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [`http://127.0.0.1:${MAINNET_PORT}`] } },
});

export const optimismSim = defineChain({
  id: 10,
  name: 'Optimism (sim)',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [`http://127.0.0.1:${OPTIMISM_PORT}`] } },
});

export const baseSim = defineChain({
  id: 8453,
  name: 'Base (sim)',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [`http://127.0.0.1:${BASE_PORT}`] } },
});

const connectors = connectorsForWallets(
  [{ groupName: 'Browser', wallets: [injectedWallet] }],
  {
    appName: 'dapp-e2e nextjs-multi-chain',
    projectId: '00000000000000000000000000000000',
  },
);

export const wagmiConfig = createConfig({
  chains: [mainnetSim, optimismSim, baseSim],
  connectors,
  transports: {
    [mainnetSim.id]: http(),
    [optimismSim.id]: http(),
    [baseSim.id]: http(),
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

export const CONTRACT_ADDRESS_BY_CHAIN: Record<number, `0x${string}`> = {
  [mainnetSim.id]: requireEnv(process.env.NEXT_PUBLIC_MAINNET_TOKEN, 'NEXT_PUBLIC_MAINNET_TOKEN'),
  [optimismSim.id]: requireEnv(
    process.env.NEXT_PUBLIC_OPTIMISM_TOKEN,
    'NEXT_PUBLIC_OPTIMISM_TOKEN',
  ),
  [baseSim.id]: requireEnv(process.env.NEXT_PUBLIC_BASE_TOKEN, 'NEXT_PUBLIC_BASE_TOKEN'),
};
export const PROBE_USER = requireEnv(process.env.NEXT_PUBLIC_PROBE_USER, 'NEXT_PUBLIC_PROBE_USER');

export const CHAIN_LABEL: Record<number, string> = {
  [mainnetSim.id]: 'Mainnet',
  [optimismSim.id]: 'Optimism',
  [baseSim.id]: 'Base',
};

export const SIMPLE_TOKEN_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
