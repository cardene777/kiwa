/**
 * coverage の**分母**に、測る意味の無い file が入っていないことを固定する。
 *
 * ## なぜ検査を置くか
 *
 * coverage gate は package 単位の集計値を閾値と比べるだけで、**分母の中身を見ない**。
 * 実測で 2 種類の混入があった。
 *
 * | 種類 | 実物 | 影響 |
 * |---|---|---|
 * | 型だけの file | 4 package の `src/types.ts` (compiled は `export &#123;&#125;;` だけ) | 1 行 / 0% が分母に残る |
 * | 実行されない file | `dapp/src/strict-abi-typing.ts` (`if (false)&#123; ... &#125;` の型検査専用) | 31 行 / 0% が分母に残る |
 *
 * 後者は誰からも import されておらず、`docs/quality/mutation-thresholds.md` が
 * mutation 側では既に「leave out」 と判断していた。 coverage 側だけが取り残されていた。
 *
 * ## 2 つを別々に見る
 *
 * | 検査 | 捕まえる形 |
 * |---|---|
 * | T-COV-001 | 行を 1 つも持たない file (型だけ) |
 * | T-COV-002 | 行はあるが 1 度も実行されない file (到達不能 / 未 import) |
 *
 * 片方に畳むと、もう片方が入り込んだ時に素通りする。 型だけの file は 0 行なので
 * 0% 検査では捕まらず、実行されない file は行を持つので 0 行検査では捕まらない。
 *
 * ## 何を見ないか
 *
 * **どの file を除外すべきかは決めない。** 判断材料は compiled の中身で、そこには
 * comment だけを持つ file (実体は空) のような形もある。 ここで固定するのは
 * 「結果として分母に混ざっていないこと」 までで、除外の書き方は各 package の
 * `test:cov` が持つ。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT } from './skill-md.js';

interface Entry {
  package: string;
  file: string;
  lines: { total: number; covered: number; pct: number };
}

/** 全 package の coverage 報告を 1 件ずつに開く。 */
function entries(): Entry[] {
  const out: Entry[] = [];
  const dir = resolve(REPO_ROOT, 'packages');
  for (const name of readdirSync(dir).sort()) {
    const pkg = join(dir, name);
    // 削除済 package の成果物だけが残っている dir を数えない。
    if (!existsSync(join(pkg, 'package.json'))) continue;
    const summary = join(pkg, 'coverage', 'coverage-summary.json');
    if (!existsSync(summary)) continue;
    const parsed = JSON.parse(readFileSync(summary, 'utf8')) as Record<
      string,
      { lines: { total: number; covered: number; pct: number } }
    >;
    for (const [key, value] of Object.entries(parsed)) {
      if (key === 'total') continue;
      const rel = key.split('/.vitest-dist/src/').at(-1) ?? key;
      out.push({ package: name, file: rel, lines: value.lines });
    }
  }
  return out;
}

const ENTRIES = entries();

describe('coverage の分母に測る意味の無い file が入っていない', () => {
  it('T-COV-000 coverage 報告を読めている', () => {
    // 集合が空だと以下の 2 件が 1 度も対象を見ずに通る。
    expect(
      ENTRIES.length,
      'coverage 報告を 1 件も読めていない (検査が空振りしている)。 pnpm -F <pkg> test:cov で生成する',
    ).toBeGreaterThan(0);
    // package が 1 つだけ読めた状態も空振りに近い。 実際の package 数に対する下限を置く。
    const packages = new Set(ENTRIES.map((e) => e.package));
    expect(
      packages.size,
      `coverage 報告を持つ package が ${packages.size} 件しかない (部分空振り)`,
    ).toBeGreaterThanOrEqual(20);
  });

  it('T-COV-001 行を 1 つも持たない file が分母に入っていない', () => {
    // 型だけの file (compiled が `export {};`) がここに来る。 0 行なので
    // pct は 0 と出るが、測れるものが無い。
    const empty = ENTRIES.filter((e) => e.lines.total === 0).map((e) => `${e.package}/${e.file}`);
    expect(
      empty,
      `型だけの file が分母にいる (test:cov の --coverage.exclude へ足す): ${empty.join(', ')}`,
    ).toEqual([]);
  });

  it('T-COV-002 1 度も実行されない file が分母に入っていない', () => {
    // 行はあるが 0% の file。 未 import か、到達しない分岐だけで出来ている。
    const dead = ENTRIES.filter((e) => e.lines.total > 0 && e.lines.covered === 0).map(
      (e) => `${e.package}/${e.file} (${e.lines.total} 行)`,
    );
    expect(
      dead,
      `1 度も実行されない file が分母にいる。 測るべきなら test を足し、測らないなら除外する: ${dead.join(', ')}`,
    ).toEqual([]);
  });
});
