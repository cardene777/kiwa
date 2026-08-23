import type * as FsModule from 'node:fs';
import { mkdtempSync, mkdirSync, readFileSync as realReadFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 「存在確認は通ったのに、 その直後の syscall が失敗する」 経路を走らせる
// behavior test。 実 filesystem でこの状態を作るには競合を仕込むしかないので、
// node:fs を **部分的に** 差し替える (statSync / readFileSync だけを wrap し、
// 他は実物のまま) 形で再現する。
//
// 検査対象の実装 (scan / resolveLayers / loadSignalTable / writeStackFile) は
// 差し替えない。 差し替えるのは失敗させたい 1 path の syscall だけで、 その path
// 以外は実 filesystem がそのまま応える。 process も network も起こさない。

const { actualFs, failStatFor, failReadFor } = vi.hoisted(() => ({
  actualFs: { current: null as typeof FsModule | null },
  failStatFor: { current: null as ((path: string) => boolean) | null },
  failReadFor: { current: null as ((path: string) => boolean) | null },
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof FsModule>();
  actualFs.current = actual;
  const statSync = ((path: never, ...rest: never[]) => {
    if (failStatFor.current?.(String(path))) {
      throw Object.assign(new Error(`EIO: i/o error, stat '${String(path)}'`), { code: 'EIO' });
    }
    return (actual.statSync as (...args: never[]) => unknown)(path, ...rest);
  }) as typeof FsModule.statSync;
  const readFileSync = ((path: never, ...rest: never[]) => {
    if (failReadFor.current?.(String(path))) {
      throw Object.assign(new Error(`EIO: i/o error, read '${String(path)}'`), { code: 'EIO' });
    }
    return (actual.readFileSync as (...args: never[]) => unknown)(path, ...rest);
  }) as typeof FsModule.readFileSync;
  return { ...actual, statSync, readFileSync, default: { ...actual, statSync, readFileSync } };
});

const dirs: string[] = [];

beforeEach(() => {
  failStatFor.current = null;
  failReadFor.current = null;
});

afterEach(() => {
  failStatFor.current = null;
  failReadFor.current = null;
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

/** 記録が読まれる時点より後の時刻。 これがないと全件 stale として捨てられる。 */
function fresh(): string {
  return new Date(Date.now() + 60_000).toISOString();
}

describe('scan は mtime を取れなくても manifest を返す', () => {
  it('T-SCAN-100 statSync が失敗した entry は mtimeMs を持たずに返る', async () => {
    // mtime は記録の照合に使う補助情報で、 依存一覧そのものではない。 取れない時に
    // 0 を入れると「1970 年に読んだ」 という記録になり、 読み手が必ず stale と
    // 判定する。 field ごと落とすのが正しい。
    const { scan } = await import('../src/detect/scan.js');
    const root = tempDir('kiwa-scan-fsfail-');
    writeFileSync(join(root, 'package.json'), '{"dependencies":{"next":"15"}}');

    failStatFor.current = (path) => path.endsWith('package.json');

    const found = scan(root);
    expect(found).toHaveLength(1);
    expect(found[0]?.path).toBe('package.json');
    // 依存も hash も読めている (読み取りは成功しているため)。
    expect(found[0]?.deps.map((d) => d.name)).toEqual(['next']);
    expect(found[0]?.contentHash).toMatch(/^[0-9a-f]{64}$/);
    // 取れなかった値は undefined ではなく field ごと不在。
    expect('mtimeMs' in (found[0] as object)).toBe(false);
  });
});

describe('記録の照合中に manifest を stat できないとき', () => {
  it('T-LRV-010 stat が失敗したら「読めなかった」 として記録を捨てる', async () => {
    // hash を持たない古い記録は mtime 比較しか手が無い。 stat できない相手を
    // 「変わっていない」 側に倒すと、 消えかけの manifest で絞り込むことになる。
    const { resolveLayers } = await import('../src/detect/layers.js');
    const { loadSignalTable } = await import('../src/detect/index.js');
    const { signalsFingerprint } = await import('../src/detect/detect.js');

    const root = tempDir('kiwa-layers-fsfail-');
    writeFileSync(join(root, 'package.json'), '{"dependencies":{"next":"15"}}');
    mkdirSync(join(root, '.kiwa'), { recursive: true });
    writeFileSync(
      join(root, '.kiwa', 'stack.json'),
      JSON.stringify({
        signals: signalsFingerprint(loadSignalTable()),
        generated_at: fresh(),
        // hash を持たない = mtime 比較に落ちる形。
        scanned: [{ manifest: 'package.json', language: 'typescript' }],
        detected: [{ layer: 'nextjs-rsc', manifest: 'package.json' }],
      }),
    );

    failStatFor.current = (path) => path === join(root, 'package.json');

    const resolved = resolveLayers({ cwd: root });
    expect(resolved.warnings.join(' ')).toMatch(/package\.json could not be read/);
    expect(resolved.source).toBe('all');
  });
});

describe('signal table が読めないとき', () => {
  /** `docs/stack-signals.json` をどの階層でも読めない状態にする。 */
  function hideSignalTable(): void {
    failReadFor.current = (path) => path.endsWith('stack-signals.json');
  }

  it('T-DIN-020 探索が頂上まで登り切ったら「見つからない」 として throw する', async () => {
    // 上に登り続ける実装なので、 親が自分自身になった時点で止める必要がある。
    // 止めないと 8 周まわる間ずっと同じ dir を見る。
    const { loadSignalTable } = await import('../src/detect/index.js');
    hideSignalTable();

    expect(() => loadSignalTable()).toThrow(/stack-signals\.json not found/);
  });

  it('T-DIN-021 記録の書き出しは止めず、 signals を空にして書く', async () => {
    // table が読めないことは記録を書かない理由にならない。 書かないと前回の
    // 記録がそのまま残り、 古い答えが生き続ける。 代わりに fingerprint を空に
    // すると、 読み手が「どの table で取ったか言えない記録」 として捨てる。
    const { writeStackFile } = await import('../src/detect/index.js');
    const root = tempDir('kiwa-signals-fsfail-');
    hideSignalTable();

    // 戻り値は表示用の相対 path なので、 中身は書き込み先を組み立てて読む。
    const written = writeStackFile(root, [], [{ path: 'package.json', language: 'typescript' }]);
    expect(written).toBe(join('.kiwa', 'stack.json'));

    const body = JSON.parse(realReadFileSync(join(root, '.kiwa', 'stack.json'), 'utf-8')) as {
      signals: string | null;
      scanned: unknown[];
    };
    expect(body.signals).toBe('');
    expect(body.scanned).toHaveLength(1);
  });
});
