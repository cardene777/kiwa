#!/usr/bin/env node
import { execSync } from 'node:child_process';

const cmd = process.argv[2];

if (cmd === 'doctor') {
  try {
    const path = execSync('which anvil', { encoding: 'utf8' }).trim();
    if (!path) throw new Error('not found');
    process.stdout.write(`OK anvil at ${path}\n`);
    process.exit(0);
  } catch {
    process.stderr.write(
      'ERR anvil not found. Install foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup\n',
    );
    process.exit(1);
  }
}

process.stderr.write(`Unknown command: ${cmd ?? '(none)'}\nUsage: dapp-e2e doctor\n`);
process.exit(2);
