#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { InitConflictError, runInit } from './commands/init.js';

const USAGE = `Usage: dapp-e2e <command>

Commands:
  init [--force]   Scaffold e2e/connect.spec.ts + playwright.config.ts + tsconfig.json + package.json
  doctor           Check that anvil is installed
  --help, -h       Show this message
`;

function main(): void {
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

  if (cmd === 'init') {
    const force = process.argv.includes('--force');

    try {
      const result = runInit({ force, cwd: process.cwd() });
      for (const file of result.created) {
        process.stdout.write(`created: ${file}\n`);
      }
      for (const file of result.updated) {
        process.stdout.write(`updated: ${file}\n`);
      }
      for (const warning of result.warnings) {
        process.stderr.write(`warn: ${warning}\n`);
      }
      process.stdout.write('\nNext: pnpm install && pnpm exec playwright test\n');
      process.exit(0);
    } catch (error) {
      if (error instanceof InitConflictError) {
        process.stderr.write(`ERR conflicting files: ${error.conflicts.join(', ')}\n`);
        process.stderr.write('Use --force to overwrite.\n');
        process.exit(1);
      }

      process.stderr.write(`ERR init failed: ${(error as Error).message}\n`);
      process.exit(1);
    }
  }

  if (cmd === '--help' || cmd === '-h') {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  process.stderr.write(`Unknown command: ${cmd ?? '(none)'}\n${USAGE}`);
  process.exit(2);
}

main();
