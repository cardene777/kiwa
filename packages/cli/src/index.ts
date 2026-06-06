#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { InitConflictError, runInit, type InitOptions } from './commands/init.js';

const USAGE = `Usage: kiwa <command> [options]

Commands:
  init [options]   Scaffold e2e/connect.spec.ts + playwright.config.ts + tsconfig.json + package.json
  doctor           Check that anvil is installed
  --help, -h       Show this message

init options:
  --force                       Overwrite existing files instead of failing on conflict
  --testDir <path>              Place generated spec under <path> instead of e2e/ (relative)
  --config-suffix <name>        Generate playwright.<name>.config.ts instead of playwright.config.ts
  --script-key <key>            package.json scripts key for the generated playwright command (default test:e2e)
  --with-deploy <foundry-path>  Also generate tests/{prepare-env,global-setup,global-teardown,fixture}.ts
                                pointing at the given Foundry project (relative to cwd)
`;

function takeFlagValue(argv: string[], flag: string): string | undefined {
  const eqPrefix = `${flag}=`;
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === flag) {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        throw new Error(`kiwa init: ${flag} requires a value`);
      }
      return next;
    }
    if (token !== undefined && token.startsWith(eqPrefix)) {
      return token.slice(eqPrefix.length);
    }
  }
  return undefined;
}

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
    const argv = process.argv.slice(3);
    try {
      const testDir = takeFlagValue(argv, '--testDir');
      const configSuffix = takeFlagValue(argv, '--config-suffix');
      const scriptKey = takeFlagValue(argv, '--script-key');
      const withDeploy = takeFlagValue(argv, '--with-deploy');
      const initOptions: InitOptions = {
        force: argv.includes('--force'),
        cwd: process.cwd(),
        ...(testDir !== undefined ? { testDir } : {}),
        ...(configSuffix !== undefined ? { configSuffix } : {}),
        ...(scriptKey !== undefined ? { scriptKey } : {}),
        ...(withDeploy !== undefined ? { withDeploy } : {}),
      };

      const result = runInit(initOptions);
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
