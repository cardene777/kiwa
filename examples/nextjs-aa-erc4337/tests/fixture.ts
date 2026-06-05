import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dappE2eTest } from '@dapp-e2e/core';

const ANVIL_PORT = 8545;
const OWNER_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

function readEnvValue(name: string): `0x${string}` {
  const envPath = resolve(exampleRoot, '.env.local');
  const env = Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1)];
      }),
  ) as Record<string, string>;
  const value = env[name];
  if (!value) {
    throw new Error(`${name} missing in ${envPath}`);
  }
  return value as `0x${string}`;
}

export const test = dappE2eTest.extend({
  wallets: [
    {
      name: 'Simple AA',
      rdns: 'eth.aa-simple',
      icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="16" fill="%230f172a"/%3E%3Cpath d="M16 20h32v8H16zm0 16h32v8H16z" fill="%23f59e0b"/%3E%3C/svg%3E',
      privateKey: OWNER_PK,
      isContractAccount: true,
      contractAccountAddress: readEnvValue('NEXT_PUBLIC_SMART_ACCOUNT'),
    },
  ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _anvilHandle: async ({}: any, use: (h: { port: number; stop: () => Promise<void> }) => Promise<void>) => {
    await use({
      port: ANVIL_PORT,
      stop: async () => {},
    });
  },
} as never);

export { expect } from '@playwright/test';
