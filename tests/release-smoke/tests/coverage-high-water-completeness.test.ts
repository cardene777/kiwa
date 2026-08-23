// 高水位の記録が全 package を覆っていることを検査する (Issue #2177)。
//
// `check-coverage-gates.mjs` は記録の無い package を固定閾値だけで判定する。 新規 package が
// gate を素通りしないために固定閾値の側を残す設計だが、**記録が欠けた状態が既定として固定される**
// という穴が残る (#2181 r1-f2)。 誰かが `--update-high-water` を回すまで、その package は
// ratchet の保護対象から外れ続ける。
//
// gate 自体を fail にすると新規 package を足すたびに落ちるので、そちらは fail-open のままにし、
// **欠けていることをこの検査が見る**。 例外は `WITHOUT_RECORD` に理由付きで列挙する。
//
// 落ちた時の直し方は 2 つ。
//   1. 記録を足す — 対象 package の coverage を fresh にして
//      `node scripts/check-coverage-gates.mjs --update-high-water`
//   2. 例外に足す — 理由を書いて `WITHOUT_RECORD` に追加する
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const HIGH_WATER = resolve(REPO_ROOT, 'coverage-high-water.json');

/**
 * 記録を持たないことを許す package と、その理由。
 *
 * **空にするのが目標**。 ここに残っている限り、その package は coverage が下がっても
 * 固定閾値 (lines 90 / branches 80) までしか守られない。
 */
const WITHOUT_RECORD: Record<string, string> = {
  '@kiwa-lab/auth':
    'worktree で typecheck が通らず coverage を測れなかった。 PR #2180 が merge されて ' +
    'main の coverage が fresh になった時点で --update-high-water を回して記録を足す',
};

/** gate script が判定する package の一覧。 script 自身から取る。 */
async function gatePackages(): Promise<string[]> {
  const mod = (await import(
    pathToFileURL(resolve(REPO_ROOT, 'scripts/lib/gate-inputs.mjs')).href
  )) as Record<string, unknown>;
  void mod;
  // `PACKAGES` は gate script が持つので、そちらを読む。 二重管理を避けるため
  // 一覧を手で書かない (`rules/quality.md § 導出可能記述は人手で書かない`)。
  const source = readFileSync(resolve(REPO_ROOT, 'scripts/check-coverage-gates.mjs'), 'utf8');
  const block = /const PKG_DIRS = \{([\s\S]*?)\n\};/.exec(source);
  expect(block, 'check-coverage-gates.mjs から PKG_DIRS を読めない').not.toBeNull();
  return [...block![1]!.matchAll(/'(@kiwa-lab\/[a-z0-9-]+)'\s*:/g)].map((m) => m[1]!);
}

describe('coverage 高水位の記録が全 package を覆う (#2177)', () => {
  it('T-HWC-001 記録 file が存在する', () => {
    // 消せば高水位判定が丸ごと消える。 git 追跡下にあることと合わせて、
    // 消えたことがここで分かる。
    expect(existsSync(HIGH_WATER), `${HIGH_WATER} が無い`).toBe(true);
  });

  it('T-HWC-002 gate が判定する package を 1 件以上読めている', async () => {
    // 空振り防止。 正規表現が外れると以降の検査が全て空集合で通る。
    const packages = await gatePackages();
    expect(packages.length, 'PKG_DIRS から package を 1 つも読めていない').toBeGreaterThan(0);
  });

  it('T-HWC-003 記録を持たない package は例外に列挙されている', async () => {
    const packages = await gatePackages();
    const recorded = JSON.parse(readFileSync(HIGH_WATER, 'utf8')) as Record<string, unknown>;

    const missing = packages.filter((pkg) => !(pkg in recorded)).sort();
    const allowed = Object.keys(WITHOUT_RECORD).sort();

    // 過不足の両方を見る。 例外に載せたまま記録を足した場合も落として、
    // 例外一覧が実物とずれたまま残らないようにする。
    expect(missing, '記録の無い package が例外一覧と一致しない').toEqual(allowed);
  });

  it('T-HWC-004 例外には理由が書かれている', () => {
    const withoutReason = Object.entries(WITHOUT_RECORD)
      .filter(([, reason]) => reason.trim().length < 20)
      .map(([pkg]) => pkg);
    expect(withoutReason, '理由の無い例外がある').toEqual([]);
  });

  it('T-HWC-005 記録の値が全て数値である', () => {
    // gate 側も同じ検査を持つが、そちらは実行しないと分からない。
    // ここで見ると、記録を壊す commit が test の段階で落ちる。
    const recorded = JSON.parse(readFileSync(HIGH_WATER, 'utf8')) as Record<
      string,
      Record<string, unknown>
    >;
    const entries = Object.entries(recorded);
    expect(entries.length, '記録が空').toBeGreaterThan(0);

    const broken: string[] = [];
    for (const [pkg, marks] of entries) {
      for (const [metric, value] of Object.entries(marks)) {
        if (typeof value !== 'number' || !Number.isFinite(value)) broken.push(`${pkg}.${metric}`);
      }
    }
    expect(broken, '数値でない記録がある').toEqual([]);
  });
});
