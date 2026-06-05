'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { defineChain, type Address } from 'viem';
import {
  ENTRY_POINT_ABI,
  EIP1271_MAGIC_VALUE,
  INCREMENT_CALLDATA,
  MOCK_TARGET_ABI,
  SIMPLE_ACCOUNT_ABI,
  SIMPLE_ACCOUNT_FACTORY_ABI,
} from './aa';

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
    appName: 'dapp-e2e nextjs-aa-erc4337',
    projectId: '00000000000000000000000000000000',
  },
);

export const wagmiConfig = createConfig({
  chains: [anvilChain],
  connectors,
  transports: { [anvilChain.id]: http() },
  ssr: true,
});

function requireEnv(value: string | undefined, name: string): Address {
  if (value) {
    return value as Address;
  }

  throw new Error(
    `${name} is required (set by tests/prepare-env.ts before pnpm build/start).`,
  );
}

export const ENTRY_POINT = requireEnv(
  process.env.NEXT_PUBLIC_ENTRY_POINT,
  'NEXT_PUBLIC_ENTRY_POINT',
);
export const FACTORY = requireEnv(
  process.env.NEXT_PUBLIC_FACTORY,
  'NEXT_PUBLIC_FACTORY',
);
export const MOCK_TARGET = requireEnv(
  process.env.NEXT_PUBLIC_MOCK_TARGET,
  'NEXT_PUBLIC_MOCK_TARGET',
);
export const OWNER = requireEnv(process.env.NEXT_PUBLIC_OWNER, 'NEXT_PUBLIC_OWNER');
export const SMART_ACCOUNT = requireEnv(
  process.env.NEXT_PUBLIC_SMART_ACCOUNT,
  'NEXT_PUBLIC_SMART_ACCOUNT',
);
export const ACCOUNT_SALT = BigInt(process.env.NEXT_PUBLIC_ACCOUNT_SALT ?? '1');

export {
  ENTRY_POINT_ABI,
  EIP1271_MAGIC_VALUE,
  INCREMENT_CALLDATA,
  MOCK_TARGET_ABI,
  SIMPLE_ACCOUNT_ABI,
  SIMPLE_ACCOUNT_FACTORY_ABI,
};
