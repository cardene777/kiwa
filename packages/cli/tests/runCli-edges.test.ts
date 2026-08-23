import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { runCli, type RunCliDeps } from '../src/runCli.js';

// packages/cli/src/runCli.ts のうち tests/runCli.test.ts が通っていない分岐
// (option の `=` 形 / 空値 / 値なし / 子 process が 0 件 / signal 名が読めない終了 /
// manifest はあるのに層が 1 つも当たらない検出) を走らせる behavior test。
//
// 未到達の理由は全て「関数は呼ばれているが、その入力が来ていない」 なので、
// 検査は「その入力を渡すと何が起きるか」 を stdout / stderr / exit code で見る。
// process は 1 つも起こさない (子 process は EventEmitter の代役、 detect は
// 一時 dir 上の実 file だけを読む)。

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

interface Harness {
  deps: RunCliDeps;
  out: () => string;
  err: () => string;
}

/**
 * stub していない依存は呼ばれた時点で throw する。 routing が想定外の command
 * 実装に落ちたら、 assertion ではなく例外で分かる。
 */
function harness(overrides: Partial<RunCliDeps> = {}): Harness {
  const out: string[] = [];
  const err: string[] = [];
  const base: RunCliDeps = {
    cwd: () => '/kiwa/project',
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

/** 指定の code / signal で 1 度だけ終わる子 process の代役。 */
function fakeChild(code: number | null, signal: NodeJS.Signals | null = null): ChildProcess {
  const child = new EventEmitter() as EventEmitter & { kill: () => boolean };
  child.kill = () => true;
  setImmediate(() => {
    child.emit('exit', code, signal);
  });
  return child as unknown as ChildProcess;
}

describe('runCli argv に穴が空いていても読み飛ばす', () => {
  it('T-CLI-090 anvil seed: undefined の token を positional として拾わない', async () => {
    // `argv` は shell から来る想定だが、 呼出側が配列を組み立てる経路では穴が空く。
    // 穴を positional とみなすと script path が undefined のまま先へ進むので、
    // 「読み飛ばして次の token を script path にする」 ことを確かめる。
    const seen: string[] = [];
    const h = harness({
      cwd: () => '/kiwa/project',
      runAnvilSeed: async (options) => {
        seen.push(options.scriptPath);
        return { outPath: options.outPath, port: 8545 };
      },
    });

    const argv = ['anvil', 'seed', undefined as unknown as string, 'seed.mjs', '--out', 'state.json'];
    await expect(runCli(argv, h.deps)).resolves.toBe(0);

    // 穴ではなく `seed.mjs` が script path として渡る。
    expect(seen).toEqual(['seed.mjs']);
    expect(h.out()).toContain('OK seeded state at state.json (port 8545)');
  });

  it('T-CLI-091 run --watch: undefined の token は --layer 指定として数えない', async () => {
    const asked: string[][] = [];
    const h = harness({
      runWatch: (options) => {
        asked.push([...options.layers]);
        return { plans: [], children: [] };
      },
    });

    const argv = ['run', '--watch', undefined as unknown as string, '--layer', 'api'];
    await expect(runCli(argv, h.deps)).resolves.toBe(0);

    // 穴を読み飛ばした上で `--layer api` だけが残る。
    expect(asked).toEqual([['api']]);
  });
});

describe('runCli run --watch の終了待ち', () => {

  it('T-CLI-093 code も signal も無い終了は "unknown signal" として 1 で落ちる', async () => {
    // code=null は「signal で死んだ」 を意味するが、 signal 名まで取れない終了が
    // ある。 null を 0 に丸めると異常終了が成功として通るので、 名前が読めなくても
    // 失敗として扱うことを確かめる。
    const h = harness({
      runWatch: () => ({
        plans: [{ layer: 'unit', cmd: 'vitest', args: ['--watch'] }],
        children: [fakeChild(null, null)],
      }),
    });

    await expect(runCli(['run', '--watch'], h.deps)).resolves.toBe(1);
    expect(h.err()).toBe('ERR run --watch: watcher terminated by unknown signal\n');
  });
});

describe('runCli layers の --flag=value 形', () => {
  /** layers が読む最小の project。 検出は package.json 1 件で足りる。 */
  function project(): string {
    const dir = tempDir('kiwa-cli-edges-layers-');
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { next: '15' } }));
    return dir;
  }

  it('T-CLI-094 --layer=<id> は --layer <id> と同じ 1 層を選ぶ', async () => {
    const dir = project();
    const h = harness({ cwd: () => dir });

    await expect(runCli(['layers', '--layer=nextjs-rsc'], h.deps)).resolves.toBe(0);
    expect(h.out()).toBe('nextjs-rsc\n');
  });

  it('T-CLI-095 --module を値なしで置くと 2 で落ちる', async () => {
    const h = harness();
    await expect(runCli(['layers', '--module'], h.deps)).resolves.toBe(2);
    expect(h.err()).toBe('ERR layers: --module needs a value\n');
    // cwd も読まずに argv 解析だけで落ちる。
    expect(h.out()).toBe('');
  });

  it('T-CLI-096 --module=<name> は spec_path の {module} を置き換える', async () => {
    const dir = project();
    const h = harness({ cwd: () => dir });

    await expect(runCli(['layers', '--layer=api', '--module=orders', '--json'], h.deps)).resolves.toBe(0);
    const parsed = JSON.parse(h.out()) as { layers: { spec_path?: string | null }[] };
    // `=` 形で渡した値が置換に届いていることを、 置換後の文字列で見る。
    expect(parsed.layers[0]?.spec_path).toContain('orders');
    expect(parsed.layers[0]?.spec_path).not.toContain('{module}');
  });

  it('T-CLI-097 --layer= (値が空) は 2 で落ちる', async () => {
    // `--layer "$UNSET_VAR"` が展開されるとこの形になる。 空を「指定なし」 と
    // 読むと検出結果が黙って返り、 呼出側は指定した層が返ったと思い込む。
    const h = harness();
    await expect(runCli(['layers', '--layer='], h.deps)).resolves.toBe(2);
    expect(h.err()).toBe('ERR layers: --layer needs a value\n');
  });
});

describe('runCli init --detect が何も当てられなかったとき', () => {
  it('T-CLI-098 manifest はあるが層が 0 件なら空の記録を書いて 0 を返す', async () => {
    // 依存を消した project で前回の記録が生き残ると、 skill 側は無くなった層に
    // 対して動き続ける。 「当たらなかった」 ことも記録として書く必要がある。
    const dir = tempDir('kiwa-cli-edges-detect-');
    writeFileSync(
      join(dir, 'package.json'),
      // kiwa の signal table が名前を持たない依存だけを置く。
      JSON.stringify({ dependencies: { 'left-pad': '^1.3.0' } }),
    );
    const h = harness({ cwd: () => dir });

    await expect(runCli(['init', '--detect'], h.deps)).resolves.toBe(0);

    // 読んだ manifest は報告し、 層は 0 件だったと言う。
    expect(h.out()).toContain('read: package.json (1 dependencies)');
    expect(h.out()).toContain('No kiwa layer matched. Use --layer to choose one explicitly.');
    expect(h.out()).toContain('(empty)');

    const written = JSON.parse(readFileSync(join(dir, '.kiwa', 'stack.json'), 'utf-8')) as {
      detected: unknown[];
      scanned: unknown[];
    };
    // 空の `detected` が書かれ、 読んだ manifest は残る (次回の照合に要る)。
    expect(written.detected).toEqual([]);
    expect(written.scanned).toHaveLength(1);
  });
});
