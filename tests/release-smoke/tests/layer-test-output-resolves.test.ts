import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ROSTER, type RosterEntry } from './layer-roster.js';
import { REPO_ROOT, read } from './skill-md.js';

/**
 * `test_outputs` の宣言が、 repo 自身の example に解決するか。
 *
 * 宣言は持っていたが **突き合わせていなかった** (#2050)。 `cli` / `data` / `api` の 3 layer で
 * 宣言 (`{example}/tests/{module}.cli.test.ts` 等) と実 example (`tests/kiwa-cli.test.ts` 等) が
 * 食い違い、 `kiwa layers --producer <skill> --project-root examples/<x>` の `test_paths.files` が
 * 0 件を返していた。
 *
 * **0 件は失敗として現れない**。 `/kiwa-review --mode test-review` は「観測対象が無い」 として
 * 中断し、 `/kiwa-observe` は coverage gap を計算できないまま終わる。 どちらも「test が無い」 と
 * 読めてしまい、 実際には 1 file 隣にある。
 *
 * `ui` だけが一致していた。 dogfood で実際に解決を通した唯一の layer で、 他 3 件は宣言が
 * rename された時に example が取り残された形。
 */

interface Layer {
  id: string;
  test_outputs?: Record<string, string[]>;
}

const LAYERS = (JSON.parse(read('docs/layers.json')) as { layers: Layer[] }).layers;


function resolveTestPaths(entry: RosterEntry): {
  files: string[];
  patterns: string[];
} {
  const bin = resolve(REPO_ROOT, 'packages/cli/dist/bin.js');
  const out = execFileSync(
    'node',
    [
      bin,
      'layers',
      '--json',
      '--layer',
      entry.layer,
      '--lang',
      'en',
      '--module',
      entry.module,
      '--producer',
      entry.producer,
      '--project-root',
      `examples/${entry.example}`,
    ],
    { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
  );
  const layer = (
    JSON.parse(out) as {
      layers: { id: string; test_paths?: { files: string[]; patterns: string[] } }[];
    }
  ).layers.find((l) => l.id === entry.layer);
  return layer?.test_paths ?? { files: [], patterns: [] };
}

describe('test_outputs の宣言が example に解決する', () => {
  it('roster が空でなく layer が重複しない', () => {
    // 0 件だと以下の it.each が 1 度も走らず、 検査が空回りしていることに気付けない。
    expect(ROSTER.length, 'roster が空').toBeGreaterThan(0);
    const layers = ROSTER.map((r) => r.layer);
    expect(new Set(layers).size, 'roster に同じ layer が 2 度ある').toBe(layers.length);
  });

  it('roster が全 layer を覆う', () => {
    // `{example}/` 起点の宣言を持つ layer は、 実物が repo にあるはず。 roster から漏れると
    // その layer は無監視のまま壊れうる (#2052 で `e2e-generic` が 28 file 持ちながら
    // 監視外だった)。 **宣言から導く** = 手で列挙すると layer が増えた時に検査だけ古くなる。
    const declared = LAYERS.filter((layer) =>
      Object.values(layer.test_outputs ?? {}).some((paths) =>
        paths.some((path) => path.startsWith('{example}/')),
      ),
    ).map((layer) => layer.id);
    const covered = ROSTER.map((entry) => entry.layer);
    expect([...declared].sort(), 'roster に無い layer がある').toEqual([...covered].sort());
  });

  it('roster の layer / producer が宣言に実在する', () => {
    // roster が古い layer 名や producer 名を指していると、 CLI が exit 2 で落ちて
    // 「解決しない」 と区別が付かない。 先に宣言側との対応を確かめる。
    for (const entry of ROSTER) {
      const layer = LAYERS.find((l) => l.id === entry.layer);
      expect(layer, `${entry.layer}: docs/layers.json に無い`).toBeTruthy();
      expect(
        Object.keys(layer!.test_outputs ?? {}),
        `${entry.layer}: producer ${entry.producer} が宣言に無い`,
      ).toContain(entry.producer);
    }
  });

  it.each(ROSTER)('$layer ($example) の宣言が実 file を返す', (entry) => {
    const { files, patterns } = resolveTestPaths(entry);
    expect(
      files.length,
      `${entry.layer}: 宣言 ${patterns.join(', ')} に一致する file が examples/${entry.example} に無い`,
    ).toBeGreaterThan(0);
    for (const file of files) {
      expect(existsSync(resolve(REPO_ROOT, file)), `${entry.layer}: ${file} が開けない`).toBe(true);
    }
  });
});
