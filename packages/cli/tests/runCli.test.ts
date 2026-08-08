import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { signalsFingerprint } from '../src/detect/detect.js';
import { loadSignalTable } from '../src/detect/index.js';
import * as publicEntry from '../src/index.js';
import { USAGE, createDefaultDeps, exitCodeForLayersError, runCli, takeFlagValue, type RunCliDeps } from '../src/runCli.js';
import { InitConflictError, runInit, type InitOptions } from '../src/commands/init.js';
import { runAnvilSeed, type AnvilSeedOptions } from '../src/commands/anvil-seed.js';
import { runSpecToTest, type SpecToTestOptions } from '../src/commands/spec-to-test.js';
import { runWatch } from '../src/commands/run-watch.js';

// packages/cli/src/runCli.ts の argv 解析 / command routing / exit code を
// 依存注入で cover する behavior test。 process.exit を呼ばず subprocess も
// network も起動しないため、 全 command の分岐を実際に走らせて検証できる。

const CWD = '/kiwa/project';

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

/** runWatch が要求する package.json を持つ一時 project を作る。 */
function makeProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'kiwa-runcli-'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'consumer', version: '0.0.0' }), 'utf8');
  dirs.push(dir);
  return dir;
}

/** 指定 exit code を非同期に 1 度だけ発火する child process の代役。 */
function fakeChild(code: number | null, signal: NodeJS.Signals | null = null): ChildProcess {
  const child = new EventEmitter() as EventEmitter & { kill: () => boolean };
  // 実 `ChildProcess` は必ず `kill` を持つ。 fake が持たないと、呼出側が
  // 例外で止まる経路を test が素通ししてしまう (#1727 で実際に起きた)。
  // 既に終了した child への kill は実物でも無害なので、何もせず true を返す。
  child.kill = () => true;
  setImmediate(() => {
    child.emit('exit', code, signal);
  });
  return child as unknown as ChildProcess;
}

/**
 * 終了しない watcher。 実運用の watch process と同じで、`kill()` を受けて初めて
 * `exit` を出す。 即座に終了する `fakeChild` では「1 件が落ちて残りが生き続ける」
 * 状態を再現できない。
 */
function livingChild(): ChildProcess & { killed: NodeJS.Signals | 'default' | null } {
  const child = new EventEmitter() as EventEmitter & {
    killed: NodeJS.Signals | 'default' | null;
    kill: (signal?: NodeJS.Signals) => boolean;
  };
  child.killed = null;
  child.kill = (signal?: NodeJS.Signals) => {
    child.killed = signal ?? 'default';
    // 実 process と同じく、kill は非同期に exit を招く。
    setImmediate(() => child.emit('exit', null, signal ?? 'SIGTERM'));
    return true;
  };
  return child as unknown as ChildProcess & { killed: NodeJS.Signals | 'default' | null };
}

/** spawn 自体が失敗した child。 `exit` は来ず `error` だけが飛ぶ。 */
function failingChild(message: string): ChildProcess {
  const child = new EventEmitter() as EventEmitter & { kill: () => boolean };
  child.kill = () => true;
  setImmediate(() => {
    child.emit('error', new Error(message));
  });
  return child as unknown as ChildProcess;
}

interface Harness {
  deps: RunCliDeps;
  out: () => string;
  err: () => string;
}

/**
 * stdout / stderr を収集する deps を組み立てる。 stub していない依存は呼ばれた
 * 時点で throw するので、 routing が想定外の command 実装を呼んだら test が落ちる。
 */
function harness(overrides: Partial<RunCliDeps> = {}): Harness {
  const out: string[] = [];
  const err: string[] = [];
  const base: RunCliDeps = {
    cwd: () => CWD,
    stdout: (chunk) => {
      out.push(chunk);
    },
    stderr: (chunk) => {
      err.push(chunk);
    },
    execSync: () => {
      throw new Error('execSync was not stubbed for this case');
    },
    runInit: () => {
      throw new Error('runInit was not stubbed for this case');
    },
    runAnvilSeed: () => {
      throw new Error('runAnvilSeed was not stubbed for this case');
    },
    runSpecToTest: () => {
      throw new Error('runSpecToTest was not stubbed for this case');
    },
    runWatch: () => {
      throw new Error('runWatch was not stubbed for this case');
    },
  };
  return {
    deps: { ...base, ...overrides },
    out: () => out.join(''),
    err: () => err.join(''),
  };
}

describe('runCli dispatch', () => {
  it('T-CLI-001 --help prints the usage text on stdout and exits 0', async () => {
    const h = harness();
    await expect(runCli(['--help'], h.deps)).resolves.toBe(0);
    expect(h.out()).toBe(USAGE);
    expect(h.err()).toBe('');
  });

  it('T-CLI-002 -h is an alias of --help', async () => {
    const h = harness();
    await expect(runCli(['-h'], h.deps)).resolves.toBe(0);
    expect(h.out()).toBe(USAGE);
  });

  it('T-CLI-003 an unknown command exits 2 with the name and the usage text on stderr', async () => {
    const h = harness();
    await expect(runCli(['bogus'], h.deps)).resolves.toBe(2);
    expect(h.err()).toBe(`Unknown command: bogus\n${USAGE}`);
    expect(h.out()).toBe('');
  });

  it('T-CLI-004 an empty argv reports "(none)" as the command name', async () => {
    const h = harness();
    await expect(runCli([], h.deps)).resolves.toBe(2);
    expect(h.err()).toBe(`Unknown command: (none)\n${USAGE}`);
  });

  it('T-CLI-005 "anvil" without the seed sub-command falls through to the unknown path', async () => {
    const h = harness();
    await expect(runCli(['anvil'], h.deps)).resolves.toBe(2);
    expect(h.err()).toBe(`Unknown command: anvil\n${USAGE}`);
  });

  it('T-CLI-006 a failing output sink is reported as "ERR <message>" and exits 1', async () => {
    const h = harness({
      stdout: () => {
        throw new Error('EPIPE: broken pipe');
      },
    });
    await expect(runCli(['--help'], h.deps)).resolves.toBe(1);
    expect(h.err()).toBe('ERR EPIPE: broken pipe\n');
  });
});

describe('runCli doctor', () => {
  it('T-CLI-010 resolves anvil through "which anvil" and prints the trimmed path', async () => {
    const commands: string[] = [];
    const h = harness({
      execSync: (command) => {
        commands.push(command);
        return '/opt/homebrew/bin/anvil\n';
      },
    });
    await expect(runCli(['doctor'], h.deps)).resolves.toBe(0);
    expect(commands).toEqual(['which anvil']);
    expect(h.out()).toBe('OK anvil at /opt/homebrew/bin/anvil\n');
  });

  it('T-CLI-011 an empty lookup result exits 1 with the foundry install hint', async () => {
    const h = harness({ execSync: () => '   \n' });
    await expect(runCli(['doctor'], h.deps)).resolves.toBe(1);
    expect(h.err()).toBe(
      'ERR anvil not found. Install foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup\n',
    );
    expect(h.out()).toBe('');
  });

  it('T-CLI-012 a failing lookup exits 1 with the same hint', async () => {
    const h = harness({
      execSync: () => {
        throw new Error('Command failed: which anvil');
      },
    });
    await expect(runCli(['doctor'], h.deps)).resolves.toBe(1);
    expect(h.err()).toContain('curl -L https://foundry.paradigm.xyz | bash && foundryup');
  });
});

describe('runCli init', () => {
  it('T-CLI-020 prints created / updated lines on stdout, warnings on stderr, then the next step', async () => {
    const h = harness({
      runInit: () => ({
        created: ['e2e/connect.spec.ts', 'playwright.config.ts'],
        updated: ['package.json'],
        warnings: ['tsconfig strict is off'],
      }),
    });
    await expect(runCli(['init'], h.deps)).resolves.toBe(0);
    expect(h.out()).toBe(
      'created: e2e/connect.spec.ts\ncreated: playwright.config.ts\nupdated: package.json\n\nNext: pnpm install && pnpm exec playwright test\n',
    );
    expect(h.err()).toBe('warn: tsconfig strict is off\n');
  });

  it('T-CLI-021 forwards every flag, accepting both "--flag value" and "--flag=value"', async () => {
    let seen: InitOptions | undefined;
    const h = harness({
      runInit: (options) => {
        seen = options;
        return { created: [], updated: [], warnings: [] };
      },
    });
    const argv = [
      'init',
      '--force',
      '--testDir',
      'tests/e2e',
      '--config-suffix=ci',
      '--script-key',
      'test:web',
      '--with-deploy',
      '../foundry',
    ];
    await expect(runCli(argv, h.deps)).resolves.toBe(0);
    expect(seen).toEqual({
      force: true,
      cwd: CWD,
      testDir: 'tests/e2e',
      configSuffix: 'ci',
      scriptKey: 'test:web',
      withDeploy: '../foundry',
    });
  });

  it('T-CLI-022 omits the optional keys entirely when no flag is given', async () => {
    let seen: InitOptions | undefined;
    const h = harness({
      runInit: (options) => {
        seen = options;
        return { created: [], updated: [], warnings: [] };
      },
    });
    await expect(runCli(['init'], h.deps)).resolves.toBe(0);
    expect(seen).toEqual({ force: false, cwd: CWD });
  });

  it('T-CLI-023 a conflict exits 1 listing the files and the --force hint', async () => {
    const h = harness({
      runInit: () => {
        throw new InitConflictError(['e2e/connect.spec.ts', 'playwright.config.ts']);
      },
    });
    await expect(runCli(['init'], h.deps)).resolves.toBe(1);
    expect(h.err()).toBe(
      'ERR conflicting files: e2e/connect.spec.ts, playwright.config.ts\nUse --force to overwrite.\n',
    );
  });

  it('T-CLI-024 any other failure exits 1 as "ERR init failed"', async () => {
    const h = harness({
      runInit: () => {
        throw new Error('EACCES: permission denied');
      },
    });
    await expect(runCli(['init'], h.deps)).resolves.toBe(1);
    expect(h.err()).toBe('ERR init failed: EACCES: permission denied\n');
  });

  it('T-CLI-025 a flag without a value exits 1 before runInit is reached', async () => {
    let called = false;
    const h = harness({
      runInit: () => {
        called = true;
        return { created: [], updated: [], warnings: [] };
      },
    });
    await expect(runCli(['init', '--testDir', '--force'], h.deps)).resolves.toBe(1);
    expect(called).toBe(false);
    expect(h.err()).toBe('ERR init failed: kiwa init: --testDir requires a value\n');
  });
});

describe('runCli anvil seed', () => {
  it('T-CLI-030 exits 2 when no script path is present', async () => {
    const h = harness();
    await expect(runCli(['anvil', 'seed'], h.deps)).resolves.toBe(2);
    expect(h.err()).toBe('ERR kiwa anvil seed: script path is required\n');
  });

  it('T-CLI-031 exits 2 when --out is missing', async () => {
    const h = harness();
    await expect(runCli(['anvil', 'seed', 'script/Seed.s.sol'], h.deps)).resolves.toBe(2);
    expect(h.err()).toBe('ERR kiwa anvil seed: --out <path> is required\n');
  });

  it('T-CLI-032 passes --chain-id / --port through as numbers and reports the dump path', async () => {
    let seen: AnvilSeedOptions | undefined;
    const h = harness({
      runAnvilSeed: async (options) => {
        seen = options;
        return { outPath: '/abs/state.json', port: 8545 };
      },
    });
    const argv = ['anvil', 'seed', 'script/Seed.s.sol', '--out', 'state.json', '--chain-id', '1337', '--port', '8545'];
    await expect(runCli(argv, h.deps)).resolves.toBe(0);
    expect(seen).toEqual({
      scriptPath: 'script/Seed.s.sol',
      outPath: 'state.json',
      cwd: CWD,
      chainId: 1337,
      port: 8545,
    });
    expect(h.out()).toBe('OK seeded state at /abs/state.json (port 8545)\n');
  });

  it('T-CLI-033 omits chainId / port entirely when the flags are absent', async () => {
    let seen: AnvilSeedOptions | undefined;
    const h = harness({
      runAnvilSeed: async (options) => {
        seen = options;
        return { outPath: '/abs/state.json', port: 41000 };
      },
    });
    await expect(runCli(['anvil', 'seed', 'script/Seed.s.sol', '--out=state.json'], h.deps)).resolves.toBe(0);
    expect(seen).toEqual({ scriptPath: 'script/Seed.s.sol', outPath: 'state.json', cwd: CWD });
  });

  it('T-CLI-034 a rejected seed run exits 1 as "ERR anvil seed failed"', async () => {
    const h = harness({
      runAnvilSeed: async () => {
        throw new Error('anvil seed: script not found: /abs/script/Seed.s.sol');
      },
    });
    const argv = ['anvil', 'seed', 'script/Seed.s.sol', '--out', 'state.json'];
    await expect(runCli(argv, h.deps)).resolves.toBe(1);
    expect(h.err()).toBe('ERR anvil seed failed: anvil seed: script not found: /abs/script/Seed.s.sol\n');
  });
});

describe('runCli spec-to-test', () => {
  it('T-CLI-040 exits 2 when --in or --out is missing', async () => {
    const missingBoth = harness();
    await expect(runCli(['spec-to-test'], missingBoth.deps)).resolves.toBe(2);
    expect(missingBoth.err()).toBe('ERR kiwa spec-to-test: --in <path> and --out <path> are required\n');

    const missingOut = harness();
    await expect(runCli(['spec-to-test', '--in', 'spec.md'], missingOut.deps)).resolves.toBe(2);
    expect(missingOut.err()).toBe('ERR kiwa spec-to-test: --in <path> and --out <path> are required\n');
  });

  it('T-CLI-041 forwards --layer and reports the generated case count', async () => {
    let seen: SpecToTestOptions | undefined;
    const h = harness({
      runSpecToTest: (options) => {
        seen = options;
        return { module: 'profile', layer: 'api', count: 3, outPath: '/abs/profile.test.ts' };
      },
    });
    const argv = ['spec-to-test', '--in', 'spec.md', '--out', 'profile.test.ts', '--layer', 'api'];
    await expect(runCli(argv, h.deps)).resolves.toBe(0);
    expect(seen).toEqual({ inPath: 'spec.md', outPath: 'profile.test.ts', cwd: CWD, layer: 'api' });
    expect(h.out()).toBe('OK generated 3 test cases for module "profile" (layer api) at /abs/profile.test.ts\n');
  });

  it('T-CLI-042 omits the layer key so the spec meta stays authoritative', async () => {
    let seen: SpecToTestOptions | undefined;
    const h = harness({
      runSpecToTest: (options) => {
        seen = options;
        return { module: 'profile', layer: 'ui', count: 1, outPath: '/abs/profile.test.ts' };
      },
    });
    await expect(runCli(['spec-to-test', '--in=spec.md', '--out=profile.test.ts'], h.deps)).resolves.toBe(0);
    expect(seen).toEqual({ inPath: 'spec.md', outPath: 'profile.test.ts', cwd: CWD });
  });

  it('T-CLI-043 a generator failure exits 1 as "ERR spec-to-test failed"', async () => {
    const h = harness({
      runSpecToTest: () => {
        throw new Error('spec-to-test: input not found: /abs/spec.md');
      },
    });
    const argv = ['spec-to-test', '--in', 'spec.md', '--out', 'profile.test.ts'];
    await expect(runCli(argv, h.deps)).resolves.toBe(1);
    expect(h.err()).toBe('ERR spec-to-test failed: spec-to-test: input not found: /abs/spec.md\n');
  });
});

describe('runCli run --watch', () => {
  it('T-CLI-050 exits 2 when --watch is absent', async () => {
    const h = harness();
    await expect(runCli(['run'], h.deps)).resolves.toBe(2);
    expect(h.err()).toBe('ERR kiwa run: only --watch is supported today\n');
  });

  it('T-CLI-051 exits 2 when --layer has no value', async () => {
    const trailing = harness();
    await expect(runCli(['run', '--watch', '--layer'], trailing.deps)).resolves.toBe(2);
    expect(trailing.err()).toBe('ERR kiwa run --watch: --layer requires a value\n');

    const followedByFlag = harness();
    await expect(runCli(['run', '--watch', '--layer', '--dry-run'], followedByFlag.deps)).resolves.toBe(2);
    expect(followedByFlag.err()).toBe('ERR kiwa run --watch: --layer requires a value\n');
  });

  it('T-CLI-052 --dry-run prints the unit / api / ui plans without spawning anything', async () => {
    const dir = makeProject();
    const h = harness({ cwd: () => dir, runWatch });
    await expect(runCli(['run', '--watch', '--dry-run'], h.deps)).resolves.toBe(0);
    expect(h.out()).toBe(
      'watch[unit]: pnpm exec vitest --watch --dir tests/unit\n' +
        'watch[api]: pnpm exec vitest --watch --dir tests/integration\n' +
        'watch[ui]: pnpm exec vitest --watch --dir tests\n',
    );
  });

  it('T-CLI-053 repeated --layer flags replace the default layer set', async () => {
    const dir = makeProject();
    const h = harness({ cwd: () => dir, runWatch });
    await expect(runCli(['run', '--watch', '--layer', 'api', '--layer', 'e2e', '--dry-run'], h.deps)).resolves.toBe(0);
    expect(h.out()).toBe(
      'watch[api]: pnpm exec vitest --watch --dir tests/integration\n' +
        'watch[e2e]: pnpm exec vitest --watch --dir tests/e2e\n',
    );
  });

  it('T-CLI-054 spawns one watcher per layer and exits 0 when all of them exit 0', async () => {
    const dir = makeProject();
    const spawned: Array<{ cmd: string; args: string[]; layer: string | undefined }> = [];
    const h = harness({
      cwd: () => dir,
      runWatch,
      spawnFn: (cmd, args, opts) => {
        spawned.push({ cmd, args, layer: opts.env.KIWA_WATCH_LAYER });
        return fakeChild(0);
      },
    });
    await expect(runCli(['run', '--watch', '--layer', 'unit', '--layer', 'api'], h.deps)).resolves.toBe(0);
    expect(spawned.map((s) => s.layer)).toEqual(['unit', 'api']);
    expect(spawned[0]?.cmd).toBe('pnpm');
    expect(spawned[0]?.args).toEqual(['exec', 'vitest', '--watch', '--dir', 'tests/unit']);
  });

  it('T-CLI-055 propagates the first non-zero watcher exit code', async () => {
    const dir = makeProject();
    const codes = [0, 3, 0];
    const h = harness({
      cwd: () => dir,
      runWatch,
      spawnFn: () => fakeChild(codes.shift() ?? 0),
    });
    await expect(runCli(['run', '--watch'], h.deps)).resolves.toBe(3);
  });

  it('T-CLI-081 1 件が落ちたら残りを終了させて その code で終わる (#1727)', async () => {
    // 実運用では watch は終了しない。 1 件が非 0 で落ちても残りが生き続けるため、
    // `Promise.all` で全部の exit を待つ形だと CLI が終わらず code も伝播しない。
    const dir = makeProject();
    const living: Array<ReturnType<typeof livingChild>> = [];
    let spawnCount = 0;
    const h = harness({
      cwd: () => dir,
      runWatch,
      spawnFn: () => {
        spawnCount += 1;
        // 2 番目だけが code 3 で落ち、1 / 3 番目は生き続ける。
        if (spawnCount === 2) return fakeChild(3);
        const child = livingChild();
        living.push(child);
        return child;
      },
    });

    await expect(runCli(['run', '--watch'], h.deps)).resolves.toBe(3);

    // 生きていた 2 件に終了要求が届いている。
    expect(living).toHaveLength(2);
    for (const child of living) {
      expect(child.killed).not.toBeNull();
    }
  });

  it('T-CLI-082 こちらが送った SIGTERM は失敗として数えない (#1727)', async () => {
    // 停止させた child の exit を失敗として数えると、最初に検出した code が
    // 後続の 1 に上書きされ得る。
    const dir = makeProject();
    let spawnCount = 0;
    const h = harness({
      cwd: () => dir,
      runWatch,
      spawnFn: () => {
        spawnCount += 1;
        // 1 番目が code 3。 残り 2 件は SIGTERM で終わる。
        return spawnCount === 1 ? fakeChild(3) : livingChild();
      },
    });

    await expect(runCli(['run', '--watch'], h.deps)).resolves.toBe(3);
    // SIGTERM の行は出さない (こちらが送ったものなので異常ではない)。
    expect(h.err()).not.toContain('terminated by SIGTERM');
  });

  it('T-CLI-083 --layer= に値が無ければ 2 で終わる', async () => {
    const dir = makeProject();
    const h = harness({ cwd: () => dir, runWatch });
    await expect(runCli(['run', '--watch', '--layer='], h.deps)).resolves.toBe(2);
    expect(h.err()).toContain('--layer requires a value');
  });

  it('T-CLI-086 spawn が全件失敗しても待たずに終わる (#1727)', async () => {
    // 1 件目の error で残りに停止要求が飛ぶ。 その後に届く spawn 失敗の error を
    // 「停止要求の失敗」 と誤分類すると、exit が来ない相手を待ち続ける。
    const dir = makeProject();
    const h = harness({
      cwd: () => dir,
      runWatch,
      spawnFn: () => failingChild('spawn pnpm ENOENT'),
    });

    await expect(runCli(['run', '--watch'], h.deps)).resolves.toBe(1);
  });

  it('T-CLI-085 kill が error event で失敗を伝えても exit を待つ (#1727)', async () => {
    // Node の `kill()` は失敗の伝え方が 2 通りある。 EINVAL / ENOSYS は throw、
    // EPERM 等は `error` event を emit して false を返す。 後者を spawn 失敗の
    // `error` と同じに扱うと、child が生きたまま CLI が終了して watcher が残る。
    const dir = makeProject();
    let spawnCount = 0;
    let stuckExited = false;
    const h = harness({
      cwd: () => dir,
      runWatch,
      spawnFn: () => {
        spawnCount += 1;
        if (spawnCount === 1) return fakeChild(3);
        const child = new EventEmitter() as EventEmitter & { kill: () => boolean };
        child.kill = () => {
          // 実 Node と同じ形 = 同期に error を emit して false を返す。
          // syscall は Node が `ErrnoException(err, 'kill')` で立てる値。
          const err = new Error('kill EPERM') as NodeJS.ErrnoException;
          err.syscall = 'kill';
          child.emit('error', err);
          return false;
        };
        // 停止要求は通らないが、しばらくして自力で終わる。
        setTimeout(() => {
          stuckExited = true;
          child.emit('exit', 0, null);
        }, 10);
        return child as unknown as ChildProcess;
      },
    });

    await expect(runCli(['run', '--watch'], h.deps)).resolves.toBe(3);
    // exit を待たずに返っていたら false のまま。
    expect(stuckExited).toBe(true);
    expect(h.err()).toContain('failed to stop watcher');
  });

  it('T-CLI-084 kill を持たない child でも exit を待ち続ける (#1727)', async () => {
    // 停止要求が送れない相手 (kill が throw する) でも、その child の exit を
    // 待つ promise を残さない。 残すと、失敗を検出したのに CLI が終わらない。
    const dir = makeProject();
    let spawnCount = 0;
    const h = harness({
      cwd: () => dir,
      runWatch,
      spawnFn: () => {
        spawnCount += 1;
        if (spawnCount === 1) return fakeChild(3);
        const child = new EventEmitter() as EventEmitter & { kill: () => boolean };
        child.kill = () => {
          throw new Error('kill EPERM');
        };
        // 停止要求は通らないが、child 自身は後から終了する。
        setTimeout(() => child.emit('exit', 0, null), 5);
        return child as unknown as ChildProcess;
      },
    });

    await expect(runCli(['run', '--watch'], h.deps)).resolves.toBe(3);
  });

  it('T-CLI-056 signal で落ちた watcher は成功にしない', async () => {
    // code が null で signal に名前が入る形。0 に丸めると SIGSEGV で死んだ
    // watcher が成功になり、呼び出し側は異常終了を検知できない。
    const dir = makeProject();
    const h = harness({
      cwd: () => dir,
      runWatch,
      spawnFn: () => fakeChild(null, 'SIGSEGV'),
    });
    await expect(runCli(['run', '--watch', '--layer', 'unit'], h.deps)).resolves.toBe(1);
    expect(h.err()).toContain('terminated by SIGSEGV');
  });

  it('T-CLI-058 spawn に失敗した watcher を error 経由で拾う', async () => {
    // `error` を購読していないと uncaught になり、exit を待つ promise も残る。
    const dir = makeProject();
    const h = harness({
      cwd: () => dir,
      runWatch,
      spawnFn: () => failingChild('spawn pnpm ENOENT'),
    });
    await expect(runCli(['run', '--watch', '--layer', 'unit'], h.deps)).resolves.toBe(1);
    expect(h.err()).toContain('spawn pnpm ENOENT');
  });

  it('T-CLI-059 --layer=value の形も layer 指定として扱う', async () => {
    // 他の command と takeFlagValue は両形式を扱う。ここだけ空白区切りしか
    // 見ないと、同じ指定が黙って無視されて既定の 3 layer が起動する。
    const dir = makeProject();
    const h = harness({ cwd: () => dir, runWatch });
    await expect(runCli(['run', '--watch', '--layer=api', '--dry-run'], h.deps)).resolves.toBe(0);
    expect(h.out()).toBe('watch[api]: pnpm exec vitest --watch --dir tests/integration\n');
  });

  it('T-CLI-060b option の値を script path と取り違えない', async () => {
    // `--out state.mjs` の値を positional とみなすと、その名前の file が
    // 実在した場合に入力不備のつもりで実行してしまう。
    const h = harness();
    await expect(runCli(['anvil', 'seed', '--out', 'state.mjs'], h.deps)).resolves.toBe(2);
    expect(h.err()).toBe('ERR kiwa anvil seed: script path is required\n');
  });

  it('T-CLI-057 an unknown layer exits 1 as "ERR run --watch failed"', async () => {
    const dir = makeProject();
    const h = harness({ cwd: () => dir, runWatch });
    await expect(runCli(['run', '--watch', '--layer', 'bogus', '--dry-run'], h.deps)).resolves.toBe(1);
    expect(h.err()).toBe('ERR run --watch failed: kiwa run --watch: unknown layer "bogus"\n');
  });
});

describe('takeFlagValue', () => {
  it('T-CLI-060 reads "--flag value" and "--flag=value", and returns undefined when absent', () => {
    expect(takeFlagValue(['--out', 'state.json'], '--out')).toBe('state.json');
    expect(takeFlagValue(['--out=state.json'], '--out')).toBe('state.json');
    expect(takeFlagValue(['--force', '--out', 'state.json'], '--out')).toBe('state.json');
    expect(takeFlagValue(['--force'], '--out')).toBeUndefined();
    expect(takeFlagValue([], '--out')).toBeUndefined();
  });

  it('T-CLI-061 throws when the flag is last or is followed by another flag', () => {
    expect(() => takeFlagValue(['--out'], '--out')).toThrow('kiwa init: --out requires a value');
    expect(() => takeFlagValue(['--out', '--force'], '--out')).toThrow('kiwa init: --out requires a value');
  });
});

describe('createDefaultDeps', () => {
  it('T-CLI-070 binds the CLI to the current process and to the real command implementations', () => {
    const deps = createDefaultDeps();
    expect(deps.cwd()).toBe(process.cwd());
    expect(deps.execSync('printf kiwa-probe')).toBe('kiwa-probe');
    expect(deps.runInit).toBe(runInit);
    expect(deps.runAnvilSeed).toBe(runAnvilSeed);
    expect(deps.runSpecToTest).toBe(runSpecToTest);
    expect(deps.runWatch).toBe(runWatch);

    // mockRestore() は呼び出し履歴も消すため、 restore 前に控えを取ってから assert する。
    const outSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const errSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    let outCalls: unknown[][] = [];
    let errCalls: unknown[][] = [];
    try {
      deps.stdout('to-stdout');
      deps.stderr('to-stderr');
      outCalls = [...outSpy.mock.calls];
      errCalls = [...errSpy.mock.calls];
    } finally {
      outSpy.mockRestore();
      errSpy.mockRestore();
    }
    expect(outCalls).toEqual([['to-stdout']]);
    expect(errCalls).toEqual([['to-stderr']]);
  });

  it('T-CLI-071 drives a full --help run without terminating the process', async () => {
    const outSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    let code: number;
    let written: unknown[][] = [];
    try {
      code = await runCli(['--help'], createDefaultDeps());
      written = [...outSpy.mock.calls];
    } finally {
      outSpy.mockRestore();
    }
    expect(code).toBe(0);
    expect(written).toEqual([[USAGE]]);
  });
});

describe('package entry point', () => {
  it('T-CLI-080 re-exports the CLI so embedders and the docs pipeline see one contract', async () => {
    expect(publicEntry.runCli).toBe(runCli);
    expect(publicEntry.createDefaultDeps).toBe(createDefaultDeps);
    expect(publicEntry.takeFlagValue).toBe(takeFlagValue);
    expect(publicEntry.USAGE).toBe(USAGE);

    const h = harness();
    await expect(publicEntry.runCli(['--help'], h.deps)).resolves.toBe(0);
    expect(h.out()).toBe(USAGE);
  });
});

describe('init --detect', () => {
  it('refuses a scaffold flag alongside --detect', async () => {
    // `--detect` writes no scaffold, so `--force` means nothing here. The rest
    // of `init` fails loudly on conflicting input; ignoring the flag silently
    // would be the odd one out.
    const h = harness();
    const code = await runCli(['init', '--detect', '--force'], h.deps);
    expect(code).toBe(2);
    expect(h.err()).toContain('--detect does not scaffold');
    // runInit throws if called, so reaching here proves nothing scaffolded.
  });

  it('refuses the = form of a scaffold flag too', async () => {
    const h = harness();
    const code = await runCli(['init', '--detect', '--testDir=e2e'], h.deps);
    expect(code).toBe(2);
    expect(h.err()).toContain('--testDir');
  });

  it('reports that nothing was found in an empty directory', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kiwa-detect-'));
    try {
      const h = harness({ cwd: () => dir });
      const code = await runCli(['init', '--detect'], h.deps);
      expect(code).toBe(0);
      expect(h.out()).toContain('No manifest found.');
      // AC: the look is read-only. Creating `.kiwa/stack.json` here would write
      // into a directory that has nothing to do with kiwa.
      expect(existsSync(join(dir, '.kiwa', 'stack.json'))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('invalidates an earlier answer when the manifests are gone', async () => {
    // Deleting the manifests left the previous run's layers readable, so a
    // skill would keep acting on a stack the project no longer has.
    const dir = mkdtempSync(join(tmpdir(), 'kiwa-detect-'));
    try {
      mkdirSync(join(dir, '.kiwa'), { recursive: true });
      writeFileSync(
        join(dir, '.kiwa', 'stack.json'),
        JSON.stringify({ detected: [{ layer: 'rust-axum' }] }),
      );
      const h = harness({ cwd: () => dir });
      expect(await runCli(['init', '--detect'], h.deps)).toBe(0);
      const after = JSON.parse(readFileSync(join(dir, '.kiwa', 'stack.json'), 'utf-8'));
      expect(after.detected).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('names layers in the usage text', () => {
    expect(USAGE).toContain('layers');
  });

  it('names --detect in the usage text', () => {
    // A flag absent from --help is a flag nobody finds.
    expect(USAGE).toContain('--detect');
  });
});

describe('layers', () => {
  function project(stack: unknown | null): string {
    const dir = mkdtempSync(join(tmpdir(), 'kiwa-layers-cmd-'));
    writeFileSync(join(dir, 'Cargo.toml'), '[dependencies]\n');
    if (stack !== null) {
      mkdirSync(join(dir, '.kiwa'), { recursive: true });
      // The reader rejects a recording that cannot say which signal table
      // produced it, so the fixture stamps the one it will be read against.
      const body =
        stack && typeof stack === 'object'
          ? { signals: signalsFingerprint(loadSignalTable()), ...(stack as Record<string, unknown>) }
          : stack;
      writeFileSync(join(dir, '.kiwa', 'stack.json'), JSON.stringify(body));
    }
    return dir;
  }

  const detection = {
    generated_at: new Date(Date.now() + 60_000).toISOString(),
    scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
    detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
  };

  it('prints one layer id per line', async () => {
    const dir = project(detection);
    try {
      const h = harness({ cwd: () => dir });
      expect(await runCli(['layers'], h.deps)).toBe(0);
      expect(h.out().trim().split('\n')).toContain('rust-axum');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('emits every field layers.json declares, not a subset', async () => {
    // The caller narrows on what is declared. `providers` and `selected_by`
    // are the pair that decides whether `kiwa-auth` generates one provider or
    // all five, and a projection that drops them leaves no way to ask.
    const dir = project(detection);
    try {
      const h = harness({ cwd: () => dir });
      // Named directly: the fixture has only a `Cargo.toml`, so the TypeScript
      // layers are excluded from a detected run for want of a manifest.
      expect(await runCli(['layers', '--layer', 'auth', '--json'], h.deps)).toBe(0);
      const parsed = JSON.parse(h.out()) as { layers: Record<string, unknown>[] };
      const auth = parsed.layers.find((l) => l.id === 'auth');
      expect(auth).toMatchObject({
        providers: ['nextauth', 'lucia', 'better-auth', 'clerk', 'auth0'],
        selected_by: 'kiwa-auth --provider',
        backing_package: 'auth',
        spec_dir: 'integration',
      });
      expect(auth).toHaveProperty('test_outputs');
      expect(auth).toHaveProperty('targets');
      expect(auth).toHaveProperty('variants');
      expect(auth).toHaveProperty('also_consumed_by');
      expect(auth).toHaveProperty('backing_runtime_package');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // #1855: `/kiwa-design --lang ja` writes `test-spec-{module}.nextjs.ja.md`
  // while the table declares the plain path. Two of the three consumers did not
  // know the convention, so `--lang ja` sent Layer 2 looking in the wrong place.
  it('resolves spec paths for --lang', async () => {
    const dir = project(detection);
    try {
      const h = harness({ cwd: () => dir });
      expect(await runCli(['layers', '--layer', 'api', '--lang', 'ja', '--json'], h.deps)).toBe(0);
      const parsed = JSON.parse(h.out()) as { layers: { id: string; spec_path: string }[] };
      const api = parsed.layers.find((l) => l.id === 'api');
      expect(api?.spec_path).toBe('tests/spec/integration/test-spec-{module}.api.ja.md');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('leaves spec paths alone without --lang and with --lang en', async () => {
    // A caller that forwards the flag unconditionally must get the declared
    // path back for English, or omitting the language becomes a third answer.
    const dir = project(detection);
    try {
      for (const args of [[], ['--lang', 'en']]) {
        const h = harness({ cwd: () => dir });
        expect(await runCli(['layers', '--layer', 'api', ...args, '--json'], h.deps)).toBe(0);
        const parsed = JSON.parse(h.out()) as { layers: { id: string; spec_path: string }[] };
        expect(parsed.layers.find((l) => l.id === 'api')?.spec_path).toBe(
          'tests/spec/integration/test-spec-{module}.api.md',
        );
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('accepts --lang=ja as well as --lang ja', async () => {
    const dir = project(detection);
    try {
      const h = harness({ cwd: () => dir });
      expect(await runCli(['layers', '--layer', 'api', '--lang=ja', '--json'], h.deps)).toBe(0);
      const parsed = JSON.parse(h.out()) as { layers: { spec_path: string }[] };
      expect(parsed.layers[0]?.spec_path).toMatch(/\.api\.ja\.md$/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses an empty --lang', async () => {
    // `--lang "$UNSET"` is a caller bug. Reading it as English would hand back
    // paths the producer never wrote, with nothing to show something was wrong.
    const dir = project(detection);
    try {
      const h = harness({ cwd: () => dir });
      expect(await runCli(['layers', '--lang', '', '--json'], h.deps)).toBe(2);
      expect(h.err()).toContain('--lang needs a value');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses a flag whose value is missing or is the next flag', async () => {
    // `kiwa layers --layer` used to fall through to the detection and print
    // every layer with exit 0; `--layer --json` took `--json` as the layer
    // name. Both are a caller that meant to pass a value (measured).
    const dir = project(detection);
    try {
      const cases: string[][] = [
        ['layers', '--layer'],
        ['layers', '--layer', '--json'],
        ['layers', '--lang'],
        ['layers', '--lang', '--json'],
        ['layers', '--lang', '--layer', 'api'],
      ];
      for (const args of cases) {
        const h = harness({ cwd: () => dir });
        expect(await runCli(args, h.deps), `${args.join(' ')} が通った`).toBe(2);
        expect(h.err()).toMatch(/needs a value/);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('still accepts a value that follows the flag', async () => {
    // The guard rejects anything starting with `-`, so a real value has to keep
    // working — otherwise the fix trades one defect for another.
    const dir = project(detection);
    try {
      const h = harness({ cwd: () => dir });
      expect(await runCli(['layers', '--layer', 'api', '--lang', 'ja', '--json'], h.deps)).toBe(0);
      const parsed = JSON.parse(h.out()) as { layers: { spec_path: string }[] };
      expect(parsed.layers[0]?.spec_path).toMatch(/\.api\.ja\.md$/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses a --lang that is not an ISO 639-1 code', async () => {
    // The value ends up in a path the caller opens. Measured before the check:
    // `--lang ../../etc/passwd` resolved to a path outside the spec directory.
    const dir = project(detection);
    try {
      for (const bad of ['../../etc/passwd', 'a/b', 'JA', 'jpn']) {
        const h = harness({ cwd: () => dir });
        expect(await runCli(['layers', '--lang', bad, '--json'], h.deps), `${bad} が通った`).toBe(2);
        expect(h.err()).toContain('ISO 639-1');
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('substitutes --module into the spec path', async () => {
    const dir = project(detection);
    try {
      const h = harness({ cwd: () => dir });
      expect(
        await runCli(['layers', '--layer', 'api', '--lang', 'ja', '--module', 'signup', '--json'], h.deps),
      ).toBe(0);
      const parsed = JSON.parse(h.out()) as { layers: { spec_path: string }[] };
      expect(parsed.layers[0]?.spec_path).toBe(
        'tests/spec/integration/test-spec-signup.api.ja.md',
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses a --module that is not a module name', async () => {
    // A separator makes the path point outside the spec directory. Measured
    // through the `sed` this replaced: `test-spec-../../etc/passwd.ui.md`.
    const dir = project(detection);
    try {
      for (const bad of ['../../etc/passwd', 'a/b', 'Signup', 'sign_up']) {
        const h = harness({ cwd: () => dir });
        expect(await runCli(['layers', '--module', bad, '--json'], h.deps), `${bad} が通った`).toBe(2);
        expect(h.err()).toContain('--module expects');
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('leaves the placeholder when --module is omitted', async () => {
    // The table's own form. A caller that wants the template back has to get it.
    const dir = project(detection);
    try {
      const h = harness({ cwd: () => dir });
      expect(await runCli(['layers', '--layer', 'api', '--json'], h.deps)).toBe(0);
      const parsed = JSON.parse(h.out()) as { layers: { spec_path: string }[] };
      expect(parsed.layers[0]?.spec_path).toContain('{module}');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('documents --lang in the usage text', async () => {
    // A flag the help does not mention is one a caller has to already know
    // about, which is the state this Issue is fixing.
    //
    // Asserted on the options list, not on the word. `--lang` also appears in
    // the command summary line, so `toContain('--lang')` stayed green while the
    // options entry was missing and only its continuation line remained — which
    // is exactly what a botched edit left behind here.
    const h = harness({ cwd: () => process.cwd() });
    expect(await runCli(['--help'], h.deps)).toBe(0);
    const out = h.out();
    expect(out).toMatch(/^\s+--lang C\s+\S/m);
    // The continuation line has to have its entry, or the help reads as if it
    // belongs to the flag above.
    const lines = out.split('\n');
    const cont = lines.findIndex((l) => l.includes('en and omitting the flag'));
    expect(cont).toBeGreaterThan(0);
    expect(lines[cont - 1], '継続行の直前が --lang の項目でない').toMatch(/--lang C/);
  });

  it('emits the consumer skill and mode with --json', async () => {
    // The caller needs to know which skill to start and with which mode, and
    // making it look that up separately is how the contract drifted before.
    const dir = project(detection);
    try {
      const h = harness({ cwd: () => dir });
      expect(await runCli(['layers', '--json'], h.deps)).toBe(0);
      const parsed = JSON.parse(h.out()) as {
        source: string;
        layers: { id: string; consumer_skill: string | null; mode: string | null }[];
      };
      expect(parsed.source).toBe('detected');
      const axum = parsed.layers.find((l) => l.id === 'rust-axum');
      expect(axum).toMatchObject({ consumer_skill: 'kiwa-rust', mode: 'axum' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('lets an explicit layer win over the detection', async () => {
    const dir = project(detection);
    try {
      const h = harness({ cwd: () => dir });
      expect(await runCli(['layers', '--layer', 'contract'], h.deps)).toBe(0);
      expect(h.out().trim()).toBe('contract');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('stays at exit 0 when the detection is discarded', async () => {
    // Detection only supplies a default. Failing to supply one must not stop
    // the caller, so the warning goes to stderr and the code stays 0.
    const dir = project({
      generated_at: new Date(Date.now() - 60_000).toISOString(),
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [{ layer: 'rust-unit', manifest: 'Cargo.toml' }],
    });
    try {
      const h = harness({ cwd: () => dir });
      expect(await runCli(['layers'], h.deps)).toBe(0);
      expect(h.err()).toContain('WARN');
      expect(h.out().trim().split('\n').length).toBeGreaterThan(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses an unknown layer with exit 2', async () => {
    const dir = project(null);
    try {
      const h = harness({ cwd: () => dir });
      expect(await runCli(['layers', '--layer', 'nope'], h.deps)).toBe(2);
      expect(h.err()).toContain('unknown layer');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('separates a typo from a broken install', () => {
    // Both reach the same catch, and collapsing them leaves a caller unable to
    // tell "you asked for a layer that does not exist" from "this package is
    // missing a file it ships".
    expect(exitCodeForLayersError('unknown layer: nope')).toBe(2);
    expect(exitCodeForLayersError('layers.json not found')).toBe(1);
    expect(exitCodeForLayersError('/x/layers.json is not valid JSON')).toBe(1);
  });

  it('refuses an unknown option with exit 2', async () => {
    const dir = project(null);
    try {
      const h = harness({ cwd: () => dir });
      expect(await runCli(['layers', '--wat'], h.deps)).toBe(2);
      expect(h.err()).toContain('unknown option');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
