// 追跡状態と exit hook の契約を撃ち抜く test。
//
// ## 狙い
//
// `temp.ts` の生存変異のうち、`decodeName` 以外に残っていたのは
// **状態を持つ側** (exit hook の 1 度きり登録 / dispose 失敗時の追跡保持 /
// 走査状態の reset) だった。 いずれも「呼べた」 だけでは壊れても気付けない。
//
// 観測できる形に落とす。
//
// | 契約 | 観測する場所 |
// |---|---|
// | exit hook は 1 度しか登録しない | `process.listeners('exit')` の件数 |
// | dispose が失敗したら追跡に残す | その後 exit hook が消せるか |
// | reset で走査状態が戻る | 同じ root で回収がもう 1 度走るか |
//
// **本 file は exit hook を発火させる**。 `outstanding` は module 単位の状態なので、
// vitest の file 隔離により他 file の test には影響しない。
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createManagedTempDir, __resetTempScanStateForTests } from '../src/index.js';

const HOUR = 60 * 60 * 1000;
const roots: string[] = [];

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-lifecycle-spec-'));
  roots.push(root);
  return root;
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

/** 回収対象になる形の dir を置く。 */
function seedReclaimable(root: string, tag: string): string {
  const path = join(root, `kiwa-${tag}-${Date.now() - 25 * HOUR}-${deadPid()}-abcdef`);
  mkdirSync(path);
  writeFileSync(join(path, 'payload.txt'), 'x');
  return path;
}

/** 登録済みの exit hook をその場で走らせる。 実際に終了させられないため。 */
function fireExitHooks(): void {
  for (const listener of process.listeners('exit')) {
    (listener as (code: number) => void)(0);
  }
}

const runningAsRoot = process.getuid?.() === 0;

afterEach(() => {
  while (roots.length > 0) {
    const root = roots.pop();
    if (!root) continue;
    try {
      chmodSync(root, 0o700);
    } catch {
      // 既に消えている場合は何もしなくてよい。
    }
    rmSync(root, { recursive: true, force: true });
  }
});

describe('label の検証が理由を返す', () => {
  it('落ちる時、期待する形と受け取った値の両方を message に載せる', () => {
    // message は利用者が唯一受け取る手掛かり。 「落ちた」 だけを見る test では、
    // 文面が空になっても気付けない。
    let caught: unknown;
    try {
      createManagedTempDir({ label: 'bad/label' });
    } catch (error) {
      caught = error;
    }
    expect(caught, '不正な label で落ちていない').toBeDefined();
    const message = (caught as Error).message;

    // 期待する形 (正規表現の中身) が出ていること。
    expect(message, '期待する形が message に無い').toContain('A-Za-z0-9');
    // 受け取った値が引用符付きで出ていること。
    expect(message, '受け取った値が message に無い').toContain('"bad/label"');
    // なぜ弾くのかが出ていること。
    expect(message, '理由が message に無い').toContain('名前空間');
  });
});

describe('exit hook は 1 度しか登録しない', () => {
  it('何度 dir を掘っても listener が増えない', () => {
    const root = makeRoot();
    // 1 件目で hook が入る。 そこを基準にする。
    const first = createManagedTempDir({ root });
    const baseline = process.listeners('exit').length;

    const rest = [
      createManagedTempDir({ root }),
      createManagedTempDir({ root }),
      createManagedTempDir({ root }),
    ];

    expect(process.listeners('exit').length, 'exit listener が掘るたびに増えている').toBe(
      baseline,
    );

    first.dispose();
    for (const dir of rest) dir.dispose();
  });
});

describe('dispose が失敗した dir は追跡に残る', () => {
  it.skipIf(runningAsRoot)('後から exit hook が消せる', () => {
    const root = makeRoot();
    const dir = createManagedTempDir({ root });

    // 親を read-only にして dispose を失敗させる。
    chmodSync(root, 0o500);
    dir.dispose();
    expect(existsSync(dir.path), 'dispose が失敗していない').toBe(true);

    // 権限を戻してから exit hook を走らせる。 **追跡に残っていれば消える**。
    // 追跡から外れていると、ここで消えずに残る。
    chmodSync(root, 0o700);
    fireExitHooks();

    expect(existsSync(dir.path), 'dispose 失敗後に追跡から外れている').toBe(false);
  });
});

describe('走査状態の reset', () => {
  it('reset すると同じ root で回収がもう 1 度走る', () => {
    const root = makeRoot();

    // 1 回目 = 回収が走り、対象が消える。
    const firstVictim = seedReclaimable(root, 'first');
    const a = createManagedTempDir({ root });
    a.dispose();
    expect(existsSync(firstVictim), '1 回目の回収が走っていない').toBe(false);

    // 2 回目 = 同じ root なので走査しない。 対象は残る。
    const secondVictim = seedReclaimable(root, 'second');
    const b = createManagedTempDir({ root });
    b.dispose();
    expect(existsSync(secondVictim), '同じ root で 2 度走査している').toBe(true);

    // reset 後 = もう 1 度走る。 **reset が何もしないと残ったままになる**。
    __resetTempScanStateForTests();
    const c = createManagedTempDir({ root });
    c.dispose();
    expect(existsSync(secondVictim), 'reset しても走査状態が戻っていない').toBe(false);
  });
});
