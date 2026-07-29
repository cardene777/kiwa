import { execSync as nodeExecSync, type ChildProcess } from 'node:child_process';
import { InitConflictError, runInit, type InitOptions, type InitResult } from './commands/init.js';
import { runAnvilSeed, type AnvilSeedOptions, type AnvilSeedResult } from './commands/anvil-seed.js';
import { runSpecToTest, type SpecToTestOptions } from './commands/spec-to-test.js';
import { runWatch, type RunWatchLayer, type RunWatchOptions, type RunWatchResult } from './commands/run-watch.js';

/** Usage text printed by `--help` / `-h` and appended to the unknown-command error. */
export const USAGE = `Usage: kiwa <command> [options]

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

/** What `spec-to-test` reports back after writing the generated test file. */
export interface SpecToTestSummary {
  module: string;
  layer: string;
  count: number;
  outPath: string;
}

/**
 * Every side effect `runCli` performs.
 *
 * `bin.ts` passes the process-backed implementations; tests pass fakes so that
 * argv parsing, command routing and exit codes can be exercised without
 * spawning subprocesses, touching the network or terminating the test process.
 */
export interface RunCliDeps {
  /** Working directory handed to each command implementation. */
  cwd: () => string;
  /** Sink for everything the CLI writes to stdout. */
  stdout: (chunk: string) => void;
  /** Sink for everything the CLI writes to stderr. */
  stderr: (chunk: string) => void;
  /** Runs a shell command and returns its stdout; `doctor` locates anvil with it. */
  execSync: (command: string) => string;
  runInit: (options: InitOptions) => InitResult;
  runAnvilSeed: (options: AnvilSeedOptions) => Promise<AnvilSeedResult>;
  runSpecToTest: (options: SpecToTestOptions) => SpecToTestSummary;
  runWatch: (options: RunWatchOptions) => RunWatchResult;
  /** Forwarded to `runWatch`; lets a caller observe the spawned children. */
  spawnFn?: RunWatchOptions['spawnFn'];
}

/** Dependencies backed by the current node process, used by the `kiwa` executable. */
export function createDefaultDeps(): RunCliDeps {
  return {
    cwd: () => process.cwd(),
    stdout: (chunk) => {
      process.stdout.write(chunk);
    },
    stderr: (chunk) => {
      process.stderr.write(chunk);
    },
    execSync: (command) => nodeExecSync(command, { encoding: 'utf8' }),
    runInit,
    runAnvilSeed,
    runSpecToTest,
    runWatch,
  };
}

/**
 * Reads the value of `--flag value` or `--flag=value` from `argv`.
 *
 * Returns undefined when the flag is absent, and throws when the flag is
 * present but the following token is missing or is itself a flag.
 */
export function takeFlagValue(argv: string[], flag: string): string | undefined {
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

/**
 * option の値を除いた positional だけを返す。
 *
 * 「`--` で始まらない最初の token」 を positional とみなすと、
 * `anvil seed --out state.mjs` の `state.mjs` を拾ってしまう。 script path として
 * 渡されるので、 その名前の file が実在すれば入力不備のつもりで実行してしまう。
 * 値を取る option を知った上で読み飛ばす。
 */
function positionalArgs(argv: string[], valueFlags: readonly string[]): string[] {
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === undefined) continue;
    if (token.startsWith('--')) {
      // `--flag=value` は 1 token で完結するので読み飛ばしは要らない。
      if (token.includes('=')) continue;
      if (valueFlags.includes(token)) i += 1;
      continue;
    }
    positionals.push(token);
  }
  return positionals;
}

const ANVIL_SEED_VALUE_FLAGS = ['--out', '--chain-id', '--port'] as const;

async function anvilSeedCommand(argv: string[], deps: RunCliDeps): Promise<number> {
  const scriptPath = positionalArgs(argv, ANVIL_SEED_VALUE_FLAGS)[0];
  if (!scriptPath) {
    deps.stderr('ERR kiwa anvil seed: script path is required\n');
    return 2;
  }
  try {
    const out = takeFlagValue(argv, '--out');
    if (!out) {
      deps.stderr('ERR kiwa anvil seed: --out <path> is required\n');
      return 2;
    }
    const chainIdRaw = takeFlagValue(argv, '--chain-id');
    const portRaw = takeFlagValue(argv, '--port');
    const result = await deps.runAnvilSeed({
      scriptPath,
      outPath: out,
      cwd: deps.cwd(),
      ...(chainIdRaw !== undefined ? { chainId: Number(chainIdRaw) } : {}),
      ...(portRaw !== undefined ? { port: Number(portRaw) } : {}),
    });
    deps.stdout(`OK seeded state at ${result.outPath} (port ${result.port})\n`);
    return 0;
  } catch (error) {
    deps.stderr(`ERR anvil seed failed: ${(error as Error).message}\n`);
    return 1;
  }
}

/**
 * watcher 全体の終了を待ち、最初の失敗を CLI の exit code にする。
 *
 * `Promise.all` で全部の `exit` を待つ形だと終わらない。 watch は本来終了しない
 * process なので、1 件が落ちても残りは動き続け、CLI は待ち続ける。 落ちた watcher の
 * code も呼出側に届かない。
 *
 * 最初の失敗を見た時点で、残りに終了を要求する。 `SIGTERM` を送るのは、watch process が
 * 片付けを持つ実装 (open file / socket / 子 process) だから。 `SIGKILL` は片付けを
 * 飛ばすので、応答しない相手にだけ使う。
 *
 * 送ったあとも全 child の `exit` を待つ。 待たずに返すと、CLI が終わったあとに
 * watcher が生き残る。
 */
async function awaitWatchers(
  children: readonly ChildProcess[],
  stderr: (text: string) => void,
): Promise<number> {
  if (children.length === 0) return 0;

  let firstFailure: number | null = null;
  const stopOthers = (except: number): void => {
    children.forEach((child, index) => {
      if (index === except) return;
      // 既に終了している child への kill は無害 (ESRCH は握り潰される)。
      // 生死を先に確かめる術がないので、送ってから exit を待つ。
      //
      // 送れなかった場合も待ち続ける。 ここで throw すると、その child の exit を
      // 待つ promise が解決されないまま残り、失敗を検出したのに CLI が終わらない
      // という、この関数が直そうとしている状態そのものになる。
      try {
        child.kill();
      } catch {
        // 送れない相手は、こちらから終わらせる手段がない。 exit を待つ。
      }
    });
  };

  await Promise.all(
    children.map(
      (child, index) =>
        new Promise<void>((resolveFn) => {
          const fail = (code: number): void => {
            if (firstFailure === null) {
              firstFailure = code;
              stopOthers(index);
            }
            resolveFn();
          };

          // signal で落ちた watcher は `code` が null で `signal` に名前が入る。
          // null を 0 に丸めると、SIGSEGV で死んだ watcher が成功になり、
          // 呼び出し側は異常終了を検知できない。
          child.on('exit', (code, signal) => {
            if (code !== null && code !== undefined) {
              if (code === 0) {
                resolveFn();
                return;
              }
              fail(code);
              return;
            }
            // こちらが送った SIGTERM で終わった child は、失敗として数えない。
            // 数えると、最初の失敗の code が後続の 1 に上書きされ得る。
            if (firstFailure !== null && signal === 'SIGTERM') {
              resolveFn();
              return;
            }
            stderr(`ERR run --watch: watcher terminated by ${signal ?? 'unknown signal'}\n`);
            fail(1);
          });
          // spawn 自体が失敗すると `exit` は来ない。 購読していないと
          // uncaught error になり、 この promise も解決されないまま残る。
          child.on('error', (error) => {
            stderr(`ERR run --watch failed: ${(error as Error).message}\n`);
            fail(1);
          });
        }),
    ),
  );

  return firstFailure ?? 0;
}

async function runWatchCommand(argv: string[], deps: RunCliDeps): Promise<number> {
  if (!argv.includes('--watch')) {
    deps.stderr('ERR kiwa run: only --watch is supported today\n');
    return 2;
  }
  const layers: RunWatchLayer[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === undefined) continue;

    // `--layer=api` の形も受ける。 他の command と `takeFlagValue` は両形式を
    // 扱うので、 ここだけ空白区切りしか見ないと同じ指定が黙って無視される。
    if (token.startsWith('--layer=')) {
      const value = token.slice('--layer='.length);
      if (value.length === 0) {
        deps.stderr('ERR kiwa run --watch: --layer requires a value\n');
        return 2;
      }
      layers.push(value as RunWatchLayer);
      continue;
    }

    if (token === '--layer') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        deps.stderr('ERR kiwa run --watch: --layer requires a value\n');
        return 2;
      }
      layers.push(value as RunWatchLayer);
      i += 1;
    }
  }
  const dryRun = argv.includes('--dry-run');
  const effectiveLayers = layers.length > 0 ? layers : (['unit', 'api', 'ui'] as RunWatchLayer[]);
  try {
    const result = deps.runWatch({
      layers: effectiveLayers,
      cwd: deps.cwd(),
      dryRun,
      ...(deps.spawnFn !== undefined ? { spawnFn: deps.spawnFn } : {}),
    });
    for (const plan of result.plans) {
      deps.stdout(`watch[${plan.layer}]: ${plan.cmd} ${plan.args.join(' ')}\n`);
    }
    if (dryRun) {
      return 0;
    }
    return await awaitWatchers(result.children, deps.stderr);
  } catch (error) {
    deps.stderr(`ERR run --watch failed: ${(error as Error).message}\n`);
    return 1;
  }
}

function specToTestCommand(argv: string[], deps: RunCliDeps): number {
  try {
    const inPath = takeFlagValue(argv, '--in');
    const outPath = takeFlagValue(argv, '--out');
    if (!inPath || !outPath) {
      deps.stderr('ERR kiwa spec-to-test: --in <path> and --out <path> are required\n');
      return 2;
    }
    const layer = takeFlagValue(argv, '--layer');
    const result = deps.runSpecToTest({
      inPath,
      outPath,
      cwd: deps.cwd(),
      ...(layer !== undefined ? { layer } : {}),
    });
    deps.stdout(
      `OK generated ${result.count} test cases for module "${result.module}" (layer ${result.layer}) at ${result.outPath}\n`,
    );
    return 0;
  } catch (error) {
    deps.stderr(`ERR spec-to-test failed: ${(error as Error).message}\n`);
    return 1;
  }
}

function doctorCommand(deps: RunCliDeps): number {
  try {
    const path = deps.execSync('which anvil').trim();
    if (!path) throw new Error('not found');
    deps.stdout(`OK anvil at ${path}\n`);
    return 0;
  } catch {
    deps.stderr(
      'ERR anvil not found. Install foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup\n',
    );
    return 1;
  }
}

function initCommand(argv: string[], deps: RunCliDeps): number {
  try {
    const testDir = takeFlagValue(argv, '--testDir');
    const configSuffix = takeFlagValue(argv, '--config-suffix');
    const scriptKey = takeFlagValue(argv, '--script-key');
    const withDeploy = takeFlagValue(argv, '--with-deploy');
    const initOptions: InitOptions = {
      force: argv.includes('--force'),
      cwd: deps.cwd(),
      ...(testDir !== undefined ? { testDir } : {}),
      ...(configSuffix !== undefined ? { configSuffix } : {}),
      ...(scriptKey !== undefined ? { scriptKey } : {}),
      ...(withDeploy !== undefined ? { withDeploy } : {}),
    };

    const result = deps.runInit(initOptions);
    for (const file of result.created) {
      deps.stdout(`created: ${file}\n`);
    }
    for (const file of result.updated) {
      deps.stdout(`updated: ${file}\n`);
    }
    for (const warning of result.warnings) {
      deps.stderr(`warn: ${warning}\n`);
    }
    deps.stdout('\nNext: pnpm install && pnpm exec playwright test\n');
    return 0;
  } catch (error) {
    if (error instanceof InitConflictError) {
      deps.stderr(`ERR conflicting files: ${error.conflicts.join(', ')}\n`);
      deps.stderr('Use --force to overwrite.\n');
      return 1;
    }

    deps.stderr(`ERR init failed: ${(error as Error).message}\n`);
    return 1;
  }
}

async function dispatch(argv: string[], deps: RunCliDeps): Promise<number> {
  const cmd = argv[0];

  if (cmd === 'anvil' && argv[1] === 'seed') {
    return anvilSeedCommand(argv.slice(2), deps);
  }
  if (cmd === 'run') {
    return runWatchCommand(argv.slice(1), deps);
  }
  if (cmd === 'spec-to-test') {
    return specToTestCommand(argv.slice(1), deps);
  }
  if (cmd === 'doctor') {
    return doctorCommand(deps);
  }
  if (cmd === 'init') {
    return initCommand(argv.slice(1), deps);
  }
  if (cmd === '--help' || cmd === '-h') {
    deps.stdout(USAGE);
    return 0;
  }

  deps.stderr(`Unknown command: ${cmd ?? '(none)'}\n${USAGE}`);
  return 2;
}

/**
 * Runs one `kiwa` invocation and resolves with the process exit code.
 *
 * `argv` excludes the node binary and the script path (`process.argv.slice(2)`).
 * The function never terminates the process and never rejects: unexpected
 * failures are reported on stderr as `ERR <message>` and resolve with 1.
 */
export async function runCli(argv: string[], deps: RunCliDeps): Promise<number> {
  try {
    return await dispatch(argv, deps);
  } catch (error) {
    deps.stderr(`ERR ${(error as Error).message}\n`);
    return 1;
  }
}
