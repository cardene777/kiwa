import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { killAnvilFromPidFile } from '@kiwa/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

export default async function globalTeardown(): Promise<void> {
  killAnvilFromPidFile(resolve(exampleRoot, '.context/anvil.pid'));
}
