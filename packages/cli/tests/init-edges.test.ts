import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { rollback, runInit } from '../src/commands/init.js';

// packages/cli/src/commands/init.ts のうち tests/init.test.ts が通っていない
// 失敗経路 (tsconfig.json の書き出しに失敗した時の巻き戻し / 巻き戻しの途中で
// 消せない対象に当たった時) を走らせる behavior test。
//
// 失敗は実 filesystem の状態で起こす。 書き込み先を「実体の無い symlink」 にすると
// 存在確認は通り書き込みだけが ENOENT で落ちるので、 fs を差し替えずに
// runInit の巻き戻しをそのまま観測できる。 process も network も起こさない。

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'kiwa-init-edges-'));
  dirs.push(dir);
  return dir;
}

describe('runInit の巻き戻し', () => {
  it('T-INIT-120 tsconfig.json を書けなければ、 作った file を消して throw する', () => {
    const cwd = tempDir();
    // 実体の無い symlink。 `existsSync` は false (追った先が無い) を返すので
    // init は「まだ無いから作る」 と判断し、 `writeFileSync` は追った先の親 dir が
    // 無いため ENOENT で落ちる。 「存在確認は通ったが書けない」 を実体で作る。
    symlinkSync(join(cwd, 'missing-dir', 'tsconfig.json'), join(cwd, 'tsconfig.json'));

    expect(() => runInit({ force: false, cwd })).toThrow(/ENOENT/);

    // ここまでに作った scaffold は残さない。 残すと再実行が conflict で止まり、
    // 「途中まで書けた project」 を手で片付けることになる。
    expect(existsSync(join(cwd, 'e2e', 'connect.spec.ts'))).toBe(false);
    expect(existsSync(join(cwd, 'playwright.config.ts'))).toBe(false);
    // 作った dir も畳む。
    expect(existsSync(join(cwd, 'e2e'))).toBe(false);
  });

  it('T-INIT-121 巻き戻しで消せない対象があっても残りは消し、 元の例外を潰さない', () => {
    // 巻き戻しは best-effort。 1 件失敗した時点で throw すると、 呼出側に届くのが
    // 「元の失敗」 ではなく「片付けの失敗」 になり、 原因が分からなくなる。
    const cwd = tempDir();
    // file として記録されているのに実体は dir。 unlinkSync が EPERM で落ちる。
    mkdirSync(join(cwd, 'stuck.txt'), { recursive: true });
    writeFileSync(join(cwd, 'removable.txt'), 'x');

    expect(() => rollback(cwd, ['stuck.txt', 'removable.txt'], [])).not.toThrow();

    // 消せなかったものはそのまま、 消せるものは消える。
    expect(existsSync(join(cwd, 'stuck.txt'))).toBe(true);
    expect(existsSync(join(cwd, 'removable.txt'))).toBe(false);
  });
});
