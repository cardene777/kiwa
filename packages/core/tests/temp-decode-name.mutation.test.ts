// `decodeName` の検証鎖を 1 段ずつ撃ち抜く test。
//
// ## 狙い
//
// 行カバレッジでは `decodeName` は 100% に見えるが、変異試験では条件式が 13 件生き残る。
// 「実行された」 と「壊したら気付く」 は別で、後者を満たすには **その検査だけを
// 失敗させる入力**が要る。
//
// ## 設計
//
// 回収される名前は `kiwa-<label>-<createdAt>-<pid>-<suffix>` で、`decodeName` は
// 上から順に 7 つの検査を通す。 各 test は **1 つの検査だけを落とす名前**を作り、
// 「回収されないこと」 を見る。
//
// 他の検査も落ちる名前を使うと、その検査を消しても別の検査が拾ってしまい、
// 変異が生き残る (masking)。 実測でこの形の生存が 13 件あった。
//
// | 落とす検査 | 名前の作り方 |
// |---|---|
// | 名前空間 | 先頭を `kiwa-` 以外にする。 残りの形はすべて正しく保つ |
// | suffix の形 | 英数字 6 文字以上の前後に非英数字を混ぜる |
// | createdAt が安全な整数 | `1.5` (正の非整数、かつ `String(Number(x)) === x`) |
// | createdAt が正 | `0` |
// | pid の 10 進表記 | `099999` (先頭 0。 値は生きていない pid) |
// | dir であること | 同じ名前で **file** を置く |
//
// いずれも「閾値超え + 作った process が居ない」 を満たすので、検査を外すと消される。
// 消されないことを見れば、その検査が効いていると言える。
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createManagedTempDir, __resetTempScanStateForTests } from '../src/index.js';

const HOUR = 60 * 60 * 1000;
const roots: string[] = [];

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-decode-spec-'));
  roots.push(root);
  return root;
}

/** 居ない pid を探す。 見つからなければ大きめの値に倒す。 */
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

/** 閾値を十分に超える作成時刻。 */
function oldEnough(): number {
  return Date.now() - 25 * HOUR;
}

/** 回収を走らせる。 戻り値の dir は呼出側で使わないので捨てる。 */
function runReclaim(root: string): void {
  const dir = createManagedTempDir({ root });
  dir.dispose();
}

beforeEach(() => {
  __resetTempScanStateForTests();
});

afterEach(() => {
  while (roots.length > 0) {
    const root = roots.pop();
    if (root) rmSync(root, { recursive: true, force: true });
  }
});

describe('decodeName が 1 段ずつ効いている', () => {
  it('名前空間だけが違う entry は、他がすべて正しくても消さない', () => {
    const root = makeRoot();
    // `kiwa-` 以外で始まる。 分割数・suffix・数値はすべて正しい形にしてある =
    // 名前空間の検査を外すと復号が通り、消される。
    const victim = join(root, `notkiwa-temp-${oldEnough()}-${deadPid()}-abcdef`);
    mkdirSync(victim);

    runReclaim(root);

    expect(existsSync(victim), '名前空間の検査が効いていない').toBe(true);
  });

  it('suffix の末尾に非英数字が付く entry は消さない', () => {
    const root = makeRoot();
    // `abcdef_` は英数字 6 文字の後ろに `_` が付く。 末尾の錨を外すと前方一致で通る。
    const victim = join(root, `kiwa-temp-${oldEnough()}-${deadPid()}-abcdef_`);
    mkdirSync(victim);

    runReclaim(root);

    expect(existsSync(victim), 'suffix の末尾の錨が効いていない').toBe(true);
  });

  it('suffix の先頭に非英数字が付く entry は消さない', () => {
    const root = makeRoot();
    // `_abcdef` は先頭の錨を外すと後方一致で通る。
    const victim = join(root, `kiwa-temp-${oldEnough()}-${deadPid()}-_abcdef`);
    mkdirSync(victim);

    runReclaim(root);

    expect(existsSync(victim), 'suffix の先頭の錨が効いていない').toBe(true);
  });

  it('createdAt が整数でない entry は消さない', () => {
    const root = makeRoot();
    // `1.5` は正の値で、かつ `String(Number('1.5')) === '1.5'` なので 10 進表記の
    // 検査も通る。 整数の検査だけが落ちる形になる。
    const victim = join(root, `kiwa-temp-1.5-${deadPid()}-abcdef`);
    mkdirSync(victim);

    runReclaim(root);

    expect(existsSync(victim), 'createdAt の整数検査が効いていない').toBe(true);
  });

  it('createdAt が 0 の entry は消さない', () => {
    const root = makeRoot();
    // 境界。 `<= 0` を `< 0` に変えると 0 が通ってしまう。
    const victim = join(root, `kiwa-temp-0-${deadPid()}-abcdef`);
    mkdirSync(victim);

    runReclaim(root);

    expect(existsSync(victim), 'createdAt の下限が > 0 になっていない').toBe(true);
  });

  it('pid が 10 進表記でない entry は消さない', () => {
    const root = makeRoot();
    // 先頭 0。 `Number('0' + pid)` は同じ値になるが表記が違う =
    // 表記の検査だけが落ちる。 値そのものは居ない pid にしてある。
    const victim = join(root, `kiwa-temp-${oldEnough()}-0${deadPid()}-abcdef`);
    mkdirSync(victim);

    runReclaim(root);

    expect(existsSync(victim), 'pid の 10 進表記の検査が効いていない').toBe(true);
  });

  it('名前が合っていても file なら消さない', () => {
    const root = makeRoot();
    // 復号はすべて通る。 dir かどうかの検査だけが落とす。
    const victim = join(root, `kiwa-temp-${oldEnough()}-${deadPid()}-abcdef`);
    writeFileSync(victim, 'x');

    runReclaim(root);

    expect(existsSync(victim), 'dir 判定が効いていない').toBe(true);
  });

  it('すべての検査を通る entry は消える (対照)', () => {
    const root = makeRoot();
    // 上の 7 件が「消えないこと」 を見るため、消える形も 1 件置いて
    // **回収そのものが動いていること**を確かめる。 これが無いと、回収が
    // 丸ごと壊れていても全 test が緑になる。
    const victim = join(root, `kiwa-temp-${oldEnough()}-${deadPid()}-abcdef`);
    mkdirSync(victim);
    writeFileSync(join(victim, 'payload.txt'), 'x');

    runReclaim(root);

    expect(existsSync(victim), '回収そのものが動いていない').toBe(false);
  });
});
