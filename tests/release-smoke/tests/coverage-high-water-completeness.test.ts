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
 * **空が正常**。 ここに載っている限り、その package は coverage が下がっても固定閾値
 * (lines 90 / branches 80) までしか守られない。
 *
 * 載せる時は理由と、いつ外れるかを書く。 ただし comment は作業待ち行列にならないので、
 * T-HWC-004 が「coverage が読めるようになったら例外を外せ」 を機械的に見る (#2181 r2-f3)。
 */
const WITHOUT_RECORD: Record<string, string> = {};

/**
 * gate が判定する package の一覧。
 *
 * **module から import する**。 以前は gate script を正規表現で読んでいたが、
 * key の引用符を変えるだけで 1 件だけ静かに落ち、記録を消しても検査が通った
 * (#2181 r2-f2)。 同じ値を gate も検査も import すれば、その食い違いが起きない。
 */
async function gateInputs(): Promise<{ packages: string[]; dirs: Record<string, string> }> {
  const mod = (await import(
    pathToFileURL(resolve(REPO_ROOT, 'scripts/lib/gate-inputs.mjs')).href
  )) as { COVERAGE_PACKAGES: string[]; COVERAGE_PKG_DIRS: Record<string, string> };
  return { packages: mod.COVERAGE_PACKAGES, dirs: mod.COVERAGE_PKG_DIRS };
}

describe('coverage 高水位の記録が全 package を覆う (#2177)', () => {
  it('T-HWC-001 記録 file が存在する', () => {
    // 消せば高水位判定が丸ごと消える。 git 追跡下にあることと合わせて、
    // 消えたことがここで分かる。
    expect(existsSync(HIGH_WATER), `${HIGH_WATER} が無い`).toBe(true);
  });

  it('T-HWC-002 判定順と dir 一覧が同じ集合である', async () => {
    // 下限 1 件では**部分的な取りこぼし**を捕まえられない (#2181 r2-f2)。
    // 2 つの export が同じ集合であることまで見る。 片方だけ package を足した形も落ちる。
    const { packages, dirs } = await gateInputs();
    expect(packages.length, 'package を 1 つも読めていない').toBeGreaterThan(0);
    expect([...packages].sort(), '判定順と dir 一覧の集合が違う').toEqual(Object.keys(dirs).sort());
  });

  it('T-HWC-003 記録を持たない package は例外に列挙されている', async () => {
    const { packages } = await gateInputs();
    const recorded = JSON.parse(readFileSync(HIGH_WATER, 'utf8')) as Record<string, unknown>;

    const missing = packages.filter((pkg) => !(pkg in recorded)).sort();
    const allowed = Object.keys(WITHOUT_RECORD).sort();

    // 過不足の両方を見る。 例外に載せたまま記録を足した場合も落として、
    // 例外一覧が実物とずれたまま残らないようにする。
    expect(missing, '記録の無い package が例外一覧と一致しない').toEqual(allowed);
  });

  it('T-HWC-004 例外は coverage が測れるようになった時点で失効する', async () => {
    // **例外に期限が要る** (#2181 r2-f3)。 理由文に「PR #2180 が merge されたら」 と
    // 書いても、その条件が来たことを誰も検知しない。 comment は作業待ち行列にならない。
    //
    // 判定材料は「その package の coverage が読めるか」。 読めるなら記録を作れる状態なので、
    // 例外を残す理由が消えている。
    const { dirs } = await gateInputs();
    const stillUnmeasurable: string[] = [];
    const nowMeasurable: string[] = [];
    for (const pkg of Object.keys(WITHOUT_RECORD)) {
      const summary = resolve(REPO_ROOT, dirs[pkg] ?? '', 'coverage/coverage-summary.json');
      (existsSync(summary) ? nowMeasurable : stillUnmeasurable).push(pkg);
    }
    void stillUnmeasurable;
    expect(
      nowMeasurable,
      'coverage が読めるようになった package が例外に残っている。 ' +
        '`node scripts/check-coverage-gates.mjs --update-high-water` で記録を足し、例外から外す',
    ).toEqual([]);
  });

  it('T-HWC-004b 例外には理由が書かれている', () => {
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
