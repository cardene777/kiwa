import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dappE2eTest } from '@kiwa-test/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

function readAnvilPort(): number {
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
  );
  const port = Number(env.NEXT_PUBLIC_ANVIL_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('NEXT_PUBLIC_ANVIL_PORT is missing or invalid in .env.local');
  }
  return port;
}

export const test = dappE2eTest.extend({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _anvilHandle: async ({}: any, use: (h: { port: number; stop: () => Promise<void> }) => Promise<void>) => {
    await use({
      port: readAnvilPort(),
      stop: async () => {},
    });
  },
} as never);

export { expect } from '@playwright/test';
