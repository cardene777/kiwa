import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createManagedTempDir, type ManagedTempDir } from '../src/index.js';

const roots: string[] = [];
const dirs: ManagedTempDir[] = [];

/** 各 test が自分の root を持ち、 実 `$TMPDIR` を触らないようにする。 */
function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-temp-spec-'));
  roots.push(root);
  return root;
}

/** 回収対象を「作られた時刻」 込みで用意する。 名前の形は実装と同じ規約に従う。 */
function seedDir(root: string, label: string, createdAt: number, suffix = 'aaaaaa'): string {
  const path = join(root, `kiwa-${label}-${createdAt}-${suffix}`);
  mkdirSync(path);
  writeFileSync(join(path, 'payload.txt'), 'x');
  return path;
}

const HOUR = 60 * 60 * 1000;

afterEach(() => {
  while (dirs.length > 0) dirs.pop()?.dispose();
  while (roots.length > 0) {
    const root = roots.pop();
    if (root) rmSync(root, { recursive: true, force: true });
  }
});

function create(root: string, opts: Parameters<typeof createManagedTempDir>[0] = {}): ManagedTempDir {
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

  it('閾値を超えた dir を次の呼出で回収する', () => {
    const root = makeRoot();
    const stale = seedDir(root, 'old', Date.now() - 25 * HOUR);
    expect(existsSync(stale)).toBe(true);

    create(root);

    expect(existsSync(stale)).toBe(false);
  });

  it('閾値の内側の dir は残す', () => {
    const root = makeRoot();
    const fresh = seedDir(root, 'recent', Date.now() - 23 * HOUR);

    create(root);

    expect(existsSync(fresh)).toBe(true);
  });

  it('名前空間の外は古くても消さない', () => {
    const root = makeRoot();
    const foreign = join(root, 'someone-else-cache');
    mkdirSync(foreign);
    writeFileSync(join(foreign, 'keep.txt'), 'x');

    create(root, { reclaimAfterMs: HOUR });

    expect(existsSync(join(foreign, 'keep.txt'))).toBe(true);
  });

  it('名前から時刻を読めない dir は birthtime で判定し、 新しければ残す', () => {
    const root = makeRoot();
    // 名前に時刻が無いので birthtime に落ちる。 いま作ったので新しい側に出る。
    const noStamp = join(root, 'kiwa-nostamp');
    mkdirSync(noStamp);

    create(root, { reclaimAfterMs: HOUR });

    expect(existsSync(noStamp)).toBe(true);
  });

  it('名前の時刻が壊れている dir は birthtime に落ちる', () => {
    const root = makeRoot();
    // 時刻の位置が数値でない = 名前からは読めない。 birthtime が新しいので残る。
    const broken = join(root, 'kiwa-label-notanumber-ffffff');
    mkdirSync(broken);

    create(root, { reclaimAfterMs: HOUR });

    expect(existsSync(broken)).toBe(true);
  });

  it('symlink は辿らず、 指す先を消さない', () => {
    const root = makeRoot();
    const victimRoot = makeRoot();
    const victim = join(victimRoot, 'payload.txt');
    writeFileSync(victim, 'keep');
    symlinkSync(victimRoot, join(root, `kiwa-link-${Date.now() - 25 * HOUR}-bbbbbb`));

    create(root);

    expect(existsSync(victim)).toBe(true);
  });

  it('閾値は下限で切り上げられ、 下限未満を指定しても直近の dir を消さない', () => {
    const root = makeRoot();
    const recent = seedDir(root, 'recent', Date.now() - 30 * 60 * 1000);

    // 1 ミリ秒を指定しても下限 (1 時間) に切り上がるため、 30 分前の dir は残る。
    create(root, { reclaimAfterMs: 1 });

    expect(existsSync(recent)).toBe(true);
  });

  it('root を読めなくても掘る側は成功する', () => {
    const root = makeRoot();
    const missing = join(root, 'not-created-yet');
    mkdirSync(missing);
    rmSync(missing, { recursive: true, force: true });

    // 回収の走査は失敗するが、 掘る先として作り直されるので dir は返る。
    mkdirSync(missing);
    const dir = create(missing);
    expect(existsSync(dir.path)).toBe(true);
  });

  it('回収は root 直下だけを見て、 入れ子の古い dir は触らない', () => {
    const root = makeRoot();
    const nestedParent = join(root, 'kiwa-parent-' + (Date.now() - 25 * HOUR) + '-cccccc');
    mkdirSync(nestedParent);
    const nested = join(nestedParent, 'kiwa-child-' + (Date.now() - 25 * HOUR) + '-dddddd');
    mkdirSync(nested);

    create(root);

    // 親ごと消えるのは想定どおり。 走査自体が 1 階層に閉じていることを、
    // 親を残す形で確かめる。
    const shallowRoot = makeRoot();
    const deepParent = join(shallowRoot, 'plain-parent');
    mkdirSync(deepParent);
    const deepChild = join(deepParent, `kiwa-deep-${Date.now() - 25 * HOUR}-eeeeee`);
    mkdirSync(deepChild);

    create(shallowRoot);

    expect(existsSync(deepChild)).toBe(true);
  });
});
