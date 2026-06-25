#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { InitConflictError, runInit, type InitOptions } from './commands/init.js';
import { runAnvilSeed } from './commands/anvil-seed.js';
import { runSpecToTest } from './commands/spec-to-test.js';
import { runWatch, type RunWatchLayer } from './commands/run-watch.js';

const USAGE = `Usage: kiwa <command> [options]

Commands:
  init [options]                                            Scaffold e2e/connect.spec.ts + playwright.config.ts + tsconfig.json + package.json
  doctor                                                    Check that anvil is installed
  anvil seed <script> --out <path>                          Run <script> against a fresh anvil and dump state to <path>
  spec-to-test --in <spec.md> --out <test.ts> [--layer L]   Generate a vitest test file from a Layer 1 spec.md
  run --watch [--layer L]...                                Run vitest in watch mode across one or more layers (default unit + api + ui)
  --help, -h                                                Show this message

init options:
  --force                       Overwrite existing files instead of failing on conflict
  --testDir <path>              Place generated spec under <path> instead of e2e/ (relative)
  --config-suffix <name>        Generate playwright.<name>.config.ts instead of playwright.config.ts
  --script-key <key>            package.json scripts key for the generated playwright command (default test:e2e)
  --with-deploy <foundry-path>  Also generate tests/{prepare-env,global-setup,global-teardown,fixture}.ts
                                pointing at the given Foundry project (relative to cwd)

anvil seed options:
  --out <path>      Path to write state json (anvil --dump-state). Required.
  --chain-id <n>    Override chain id (default 31337).
  --port <n>        Bind anvil to specific port (default: random free port).

spec-to-test options:
  --in <path>       Layer 1 spec markdown file. Required.
  --out <path>      Output vitest test file. Required.
  --layer <name>    Override layer (api / ui / data / cli). Default: inferred from spec meta.

run --watch options:
  --layer <name>   Layer to watch (repeat to add more): unit / api / ui / data / cli / e2e (default unit api ui).
  --dry-run        Print the commands that would be spawned without launching them.
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

async function main(): Promise<void> {
  const cmd = process.argv[2];

  if (cmd === 'anvil' && process.argv[3] === 'seed') {
    const argv = process.argv.slice(4);
    const scriptPath = argv.find((a) => !a.startsWith('--'));
    if (!scriptPath) {
      process.stderr.write('ERR kiwa anvil seed: script path is required\n');
      process.exit(2);
    }
    try {
      const out = takeFlagValue(argv, '--out');
      if (!out) {
        process.stderr.write('ERR kiwa anvil seed: --out <path> is required\n');
        process.exit(2);
      }
      const chainIdRaw = takeFlagValue(argv, '--chain-id');
      const portRaw = takeFlagValue(argv, '--port');
      const result = await runAnvilSeed({
        scriptPath,
        outPath: out,
        cwd: process.cwd(),
        ...(chainIdRaw !== undefined ? { chainId: Number(chainIdRaw) } : {}),
        ...(portRaw !== undefined ? { port: Number(portRaw) } : {}),
      });
      process.stdout.write(`OK seeded state at ${result.outPath} (port ${result.port})\n`);
      process.exit(0);
    } catch (error) {
      process.stderr.write(`ERR anvil seed failed: ${(error as Error).message}\n`);
      process.exit(1);
    }
  }

  if (cmd === 'run') {
    const argv = process.argv.slice(3);
    if (!argv.includes('--watch')) {
      process.stderr.write('ERR kiwa run: only --watch is supported today\n');
      process.exit(2);
    }
    const layers: RunWatchLayer[] = [];
    for (let i = 0; i < argv.length; i += 1) {
      if (argv[i] === '--layer') {
        const value = argv[i + 1];
        if (!value || value.startsWith('--')) {
          process.stderr.write('ERR kiwa run --watch: --layer requires a value\n');
          process.exit(2);
        }
        layers.push(value as RunWatchLayer);
        i += 1;
      }
    }
    const dryRun = argv.includes('--dry-run');
    const effectiveLayers = layers.length > 0 ? layers : (['unit', 'api', 'ui'] as RunWatchLayer[]);
    try {
      const result = runWatch({ layers: effectiveLayers, cwd: process.cwd(), dryRun });
      for (const plan of result.plans) {
        process.stdout.write(`watch[${plan.layer}]: ${plan.cmd} ${plan.args.join(' ')}\n`);
      }
      if (dryRun) {
        process.exit(0);
      }
      const promises = result.children.map(
        (child) =>
          new Promise<number>((resolveFn) => {
            child.on('exit', (code) => resolveFn(code ?? 0));
          }),
      );
      const codes = await Promise.all(promises);
      process.exit(codes.find((c) => c !== 0) ?? 0);
    } catch (error) {
      process.stderr.write(`ERR run --watch failed: ${(error as Error).message}\n`);
      process.exit(1);
    }
  }

  if (cmd === 'spec-to-test') {
    const argv = process.argv.slice(3);
    try {
      const inPath = takeFlagValue(argv, '--in');
      const outPath = takeFlagValue(argv, '--out');
      if (!inPath || !outPath) {
        process.stderr.write('ERR kiwa spec-to-test: --in <path> and --out <path> are required\n');
        process.exit(2);
      }
      const layer = takeFlagValue(argv, '--layer');
      const result = runSpecToTest({
        inPath,
        outPath,
        cwd: process.cwd(),
        ...(layer !== undefined ? { layer } : {}),
      });
      process.stdout.write(
        `OK generated ${result.count} test cases for module "${result.module}" (layer ${result.layer}) at ${result.outPath}\n`,
      );
      process.exit(0);
    } catch (error) {
      process.stderr.write(`ERR spec-to-test failed: ${(error as Error).message}\n`);
      process.exit(1);
    }
  }

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

main().catch((error: Error) => {
  process.stderr.write(`ERR ${error.message}\n`);
  process.exit(1);
});
