import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createManagedTempDir,
  __resetTempScanStateForTests,
  type ManagedTempDir,
} from '../src/index.js';

const roots: string[] = [];
const dirs: ManagedTempDir[] = [];

const HOUR = 60 * 60 * 1000;

/** 各 test が自分の root を持ち、 実 `$TMPDIR` を触らないようにする。 */
function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-temp-spec-'));
  roots.push(root);
  return root;
}

/**
 * 回収対象を実装と同じ名前規約で用意する。
 *
 * `kiwa-<label>-<createdAt>-<pid>-<rand>`。 pid に既に居ないものを渡すと「作った
 * process は終了済」 を表せる。
 */
function seedManaged(
  root: string,
  label: string,
  createdAt: number,
  pid: number,
  rand = 'aaaaaa',
): string {
  const path = join(root, `kiwa-${label}-${createdAt}-${pid}-${rand}`);
  mkdirSync(path);
  writeFileSync(join(path, 'payload.txt'), 'x');
  return path;
}

/** 使われていない PID を探す。 見つからなければ test を諦めず大きめの値に倒す。 */
function deadPid(): number {
  for (let candidate = 99_999; candidate > 90_000; candidate -= 7) {
    try {
      process.kill(candidate, 0);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH') return candidate;
    }
  }
  return 99_999;
}

beforeEach(() => {
  // 回収の走査は root ごとに 1 度しか走らない。 test 間で状態を持ち越さない。
  __resetTempScanStateForTests();
});

afterEach(() => {
  while (dirs.length > 0) dirs.pop()?.dispose();
  while (roots.length > 0) {
    const root = roots.pop();
    if (root) rmSync(root, { recursive: true, force: true });
  }
});

function create(
  root: string,
  opts: Parameters<typeof createManagedTempDir>[0] = {},
): ManagedTempDir {
  const dir = createManagedTempDir({ root, ...opts });
  dirs.push(dir);
  return dir;
}

describe('createManagedTempDir', () => {
  it('掘った dir が存在し、 名前が名前空間で始まる', () => {
    const root = makeRoot();
    const dir = create(root, { label: 'unit' });
    expect(existsSync(dir.path)).toBe(true);
    expect(dir.path.startsWith(join(root, 'kiwa-'))).toBe(true);
  });

  it('dispose で消え、 2 度呼んでも例外にならない', () => {
    const root = makeRoot();
    const dir = create(root);
    dir.dispose();
    expect(existsSync(dir.path)).toBe(false);
    expect(() => dir.dispose()).not.toThrow();
  });

  it('閾値を超え、 作った process が終了済の dir を回収する', () => {
    const root = makeRoot();
    const stale = seedManaged(root, 'old', Date.now() - 25 * HOUR, deadPid());

    create(root);

    expect(existsSync(stale)).toBe(false);
  });

  it('閾値の内側の dir は残す', () => {
    const root = makeRoot();
    const fresh = seedManaged(root, 'recent', Date.now() - 23 * HOUR, deadPid());

    create(root);

    expect(existsSync(fresh)).toBe(true);
  });

  it('作った process が生きている間は、 古くても残す', () => {
    const root = makeRoot();
    // 自分自身の PID を持たせる = 稼働中の別 process を模す。
    const inUse = seedManaged(root, 'inuse', Date.now() - 25 * HOUR, process.pid);

    create(root);

    expect(existsSync(inUse)).toBe(true);
  });

  it('名前空間の外は古くても消さない', () => {
    const root = makeRoot();
    const foreign = join(root, 'someone-else-cache');
    mkdirSync(foreign);
    writeFileSync(join(foreign, 'keep.txt'), 'x');

    create(root, { reclaimAfterMs: HOUR });

    expect(existsSync(join(foreign, 'keep.txt'))).toBe(true);
  });

  it('kiwa- で始まっても、 自分たちが作った形でなければ消さない', () => {
    const root = makeRoot();
    // 利用者が置いた `kiwa-cache`。 時刻も PID も読めない。
    const userOwned = join(root, 'kiwa-cache');
    mkdirSync(userOwned);
    writeFileSync(join(userOwned, 'keep.txt'), 'x');
    // 時刻らしい segment を 1 つ持つが規約の形ではない。
    const lookalike = join(root, `kiwa-thing-${Date.now() - 25 * HOUR}`);
    mkdirSync(lookalike);
    writeFileSync(join(lookalike, 'keep.txt'), 'x');

    create(root, { reclaimAfterMs: HOUR });

    expect(existsSync(join(userOwned, 'keep.txt'))).toBe(true);
    expect(existsSync(join(lookalike, 'keep.txt'))).toBe(true);
  });

  it('symlink は辿らず、 指す先を消さない', () => {
    const root = makeRoot();
    const victimRoot = makeRoot();
    const victim = join(victimRoot, 'payload.txt');
    writeFileSync(victim, 'keep');
    symlinkSync(
      victimRoot,
      join(root, `kiwa-link-${Date.now() - 25 * HOUR}-${deadPid()}-bbbbbb`),
    );

    create(root);

    expect(existsSync(victim)).toBe(true);
  });

  it('閾値は下限で切り上げられ、 下限未満を指定しても直近の dir を消さない', () => {
    const root = makeRoot();
    const recent = seedManaged(root, 'recent', Date.now() - 30 * 60 * 1000, deadPid());

    create(root, { reclaimAfterMs: 1 });

    expect(existsSync(recent)).toBe(true);
  });

  it('label が path の区切りを含むと掘らずに落ちる', () => {
    const root = makeRoot();
    for (const label of ['x/../../escape', 'a/b', '..', '.', '']) {
      expect(() => createManagedTempDir({ root, label })).toThrow(/label/);
    }
  });

  it('相対 root を渡しても絶対 path を返す', () => {
    const root = makeRoot();
    const dir = create(root);
    expect(dir.path.startsWith('/')).toBe(true);
  });

  it('回収の走査は root ごとに 1 度で、 2 度目の作成では走らない', () => {
    const root = makeRoot();
    create(root);

    // 1 度目の走査後に置いた古い dir は、 同じ root への 2 度目の作成では消えない。
    const afterScan = seedManaged(root, 'late', Date.now() - 25 * HOUR, deadPid(), 'cccccc');
    create(root);

    expect(existsSync(afterScan)).toBe(true);
  });

  it('root を読めなくても掘る側は成功する', () => {
    const root = makeRoot();
    const nested = join(root, 'fresh-root');
    mkdirSync(nested);
    const dir = create(nested);
    expect(existsSync(dir.path)).toBe(true);
  });

  it('回収は root 直下だけを見て、 入れ子の古い dir は触らない', () => {
    const root = makeRoot();
    const plainParent = join(root, 'plain-parent');
    mkdirSync(plainParent);
    const deepChild = join(
      plainParent,
      `kiwa-deep-${Date.now() - 25 * HOUR}-${deadPid()}-dddddd`,
    );
    mkdirSync(deepChild);

    create(root);

    expect(existsSync(deepChild)).toBe(true);
  });
});
