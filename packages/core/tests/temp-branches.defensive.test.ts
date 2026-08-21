// `createManagedTempDir` の防御分岐を実際に通す test。
//
// ## なぜ別 file にするか
//
// `temp.test.ts` は正常系と「消さない」 判定を扱う。 本 file が扱うのは
// **回収と後始末が失敗した時に何を守るか**で、 いずれも filesystem の権限を落として
// 初めて到達する。 権限を触る test は後片付けを誤ると root ごと消せなくなるため、
// 専用の `afterEach` を持つ file に隔離する。
//
// ## 既存 test が届いていなかった範囲
//
// `temp.test.ts` の「root を読めなくても掘る側は成功する」 は、実際には root を
// 読めなくしていない (存在する dir を作って渡すだけ)。 そのため `reclaim` の
// `catch` には 1 度も入っておらず、実測でも未到達行として残っていた。
//
// ## 権限で分岐を撃ち分ける
//
// `reclaim` は `readdir` → `lstat` → `rmSync` の順に進む。 root の mode を変えると
// どこで落ちるかを選べる。
//
// | mode | readdir | lstat | rmSync | 到達する分岐 |
// |---|---|---|---|---|
// | `0o300` (-wx) | ✗ | — | — | `readdir` の catch |
// | `0o400` (r--) | ✓ | ✗ | — | `lstat` の catch |
// | `0o500` (r-x) | ✓ | ✓ | ✗ | `rmSync` の catch |
//
// `mkdtemp` は write と execute の両方を要るので、`0o400` と `0o500` では掘る側も
// 落ちる。 その 2 件は「掘れないこと」 ではなく **回収が対象を消していないこと** を
// 見る (消していたら防御分岐が効いていない)。
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createManagedTempDir,
  __resetTempScanStateForTests,
  type ManagedTempDir,
} from '../src/index.js';

const HOUR = 60 * 60 * 1000;

/** mode を戻してから消す。 戻さないと root 自体を削除できない。 */
const guarded: string[] = [];
const dirs: ManagedTempDir[] = [];

/**
 * root 権限では mode による拒否が起きない。
 *
 * skip する条件を定数に出しておく = 何を避けたのかが test 名だけからでは読めないため。
 */
const runningAsRoot = process.getuid?.() === 0;

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-temp-defensive-'));
  guarded.push(root);
  return root;
}

/** `reclaim` が回収対象とみなす形 = 閾値超え + 作った process が居ない。 */
function seedReclaimable(root: string): string {
  const path = join(root, `kiwa-old-${Date.now() - 25 * HOUR}-${deadPid()}-aaaaaa`);
  mkdirSync(path);
  writeFileSync(join(path, 'payload.txt'), 'x');
  return path;
}

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

/**
 * 「掘る側で落ちた」 ことを確かめる。
 *
 * `0o400` / `0o500` の 2 件は回収も `mkdtemp` も落ちるため、単に throw を見るだけでは
 * **回収が例外を握り潰したか**が判らない。 握り潰していなければ reclaim 側の例外が
 * そのまま出て、message は victim の名前を含む。 握り潰していれば `mkdtemp` まで進み、
 * message は掘ろうとした temp の prefix を含む。 その差で撃ち分ける。
 */
function expectThrownFromMkdtemp(root: string, victim: string): void {
  let caught: unknown;
  try {
    createManagedTempDir({ root });
  } catch (error) {
    caught = error;
  }
  expect(caught, '掘る側が落ちていない').toBeDefined();
  const message = (caught as Error).message;
  expect(message, `mkdtemp ではなく回収側の例外が出ている: ${message}`).toContain('kiwa-temp-');
  expect(message, `回収側の例外が握り潰されていない: ${message}`).not.toContain(
    victim.slice(victim.lastIndexOf('/') + 1),
  );
}

beforeEach(() => {
  __resetTempScanStateForTests();
});

afterEach(() => {
  while (dirs.length > 0) dirs.pop()?.dispose();
  while (guarded.length > 0) {
    const root = guarded.pop();
    if (!root) continue;
    // 落とした mode を戻さないと root 配下を消せない。
    try {
      chmodSync(root, 0o700);
    } catch {
      // 既に消えている場合は何もしなくてよい。
    }
    rmSync(root, { recursive: true, force: true });
  }
});

describe('createManagedTempDir の回収が失敗した時', () => {
  it.skipIf(runningAsRoot)('root を読めない時、回収を諦めて掘る側は続く', () => {
    const root = makeRoot();
    // -wx = readdir だけが落ちる。 mkdtemp は write + execute で通る。
    chmodSync(root, 0o300);

    const dir = createManagedTempDir({ root });
    dirs.push(dir);

    expect(existsSync(dir.path)).toBe(true);
  });

  it.skipIf(runningAsRoot)('root を辿れない時、回収は対象を消さずに飛ばす', () => {
    const root = makeRoot();
    const victim = seedReclaimable(root);
    // r-- = readdir は通るが lstat が落ちる。
    chmodSync(root, 0o400);

    // 掘る側も execute を要るため落ちる。 **どこで落ちたかまで見る**。
    // 「victim が残った」 だけでは、回収が例外を握り潰したのか、握り潰さず
    // reclaim ごと落ちたのかを区別できない (どちらでも victim は残る)。
    expectThrownFromMkdtemp(root, victim);

    chmodSync(root, 0o700);
    expect(existsSync(victim)).toBe(true);
  });

  it.skipIf(runningAsRoot)('root に書けない時、回収は消せなかった対象を残す', () => {
    const root = makeRoot();
    const victim = seedReclaimable(root);
    // r-x = readdir と lstat は通るが、entry の unlink が落ちる。
    chmodSync(root, 0o500);

    expectThrownFromMkdtemp(root, victim);

    chmodSync(root, 0o700);
    expect(existsSync(victim)).toBe(true);
  });
});

describe('dispose が消せなかった時', () => {
  it.skipIf(runningAsRoot)('例外を投げず、対象を残したまま返る', () => {
    const root = makeRoot();
    const dir = createManagedTempDir({ root });
    dirs.push(dir);
    // 掘った後に親を read-only にすると、entry の unlink だけが落ちる。
    chmodSync(root, 0o500);

    expect(() => dir.dispose()).not.toThrow();
    expect(existsSync(dir.path)).toBe(true);

    chmodSync(root, 0o700);
  });

  it.skipIf(runningAsRoot)('権限が戻れば、次の dispose で消える', () => {
    const root = makeRoot();
    const dir = createManagedTempDir({ root });
    dirs.push(dir);
    chmodSync(root, 0o500);
    dir.dispose();
    expect(existsSync(dir.path)).toBe(true);

    // 追跡に残っているので、再試行が効く。 残っていなければここで消えない。
    chmodSync(root, 0o700);
    dir.dispose();
    expect(existsSync(dir.path)).toBe(false);
  });

});

// **本 describe は file の最後に置く**。 exit hook は `outstanding` を全消しするため、
// 後続の test が持つ dir も巻き込む。
describe('プロセス終了時の取りこぼし回収', () => {
  it('exit hook が追跡中の dir を消す', () => {
    const root = makeRoot();
    const dir = createManagedTempDir({ root });
    expect(existsSync(dir.path)).toBe(true);

    // hook は process に登録されている。 実際に終了させられないので、
    // 登録された listener をその場で呼ぶ。
    const listeners = process.listeners('exit');
    expect(listeners.length, 'exit listener が登録されていない').toBeGreaterThan(0);
    for (const listener of listeners) {
      (listener as (code: number) => void)(0);
    }

    expect(existsSync(dir.path)).toBe(false);
  });

  it.skipIf(runningAsRoot)('消せない dir があっても、exit hook は落ちずに走り切る', () => {
    const root = makeRoot();
    const dir = createManagedTempDir({ root });
    // 親を read-only にすると exit hook の `rmSync` が落ちる。
    // 終了処理には報告先が無いため、握り潰して次の entry へ進むのが期待動作。
    chmodSync(root, 0o500);

    const listeners = process.listeners('exit');
    expect(listeners.length, 'exit listener が登録されていない').toBeGreaterThan(0);
    for (const listener of listeners) {
      expect(() => (listener as (code: number) => void)(0)).not.toThrow();
    }

    chmodSync(root, 0o700);
    // 消せていないことを確かめる = 握り潰した先で消せたことにしていない。
    expect(existsSync(dir.path)).toBe(true);
  });
});
