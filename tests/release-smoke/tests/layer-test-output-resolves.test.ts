import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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

/**
 * 宣言と突き合わせられる組。
 *
 * **全 layer は対象にしない**。 20 layer のうち生成済 test を持つ example があるのは 14 件で、
 * 残りは「まだ dogfood していない」 だけであって宣言の誤りではない。 全件を要求すると
 * 6 layer ぶんの example を作るまで赤のままになる。
 *
 * 逆に **今解決している組を減らす変更は落ちる**。 roster を減らす形でしか通せないので、
 * 減らしたことが差分に出る (`skill-cli-invocation` の起動行数と同じ形)。
 *
 * 新しく生成済 test を持つ example を足した時は、 ここに 1 行足す。
 */
const ROSTER = [
  { layer: 'contract', producer: 'kiwa-forge', module: 'defi-swap', example: 'defi-swap' },
  { layer: 'e2e', producer: 'kiwa-play', module: 'basic-connect', example: 'basic-connect' },
  { layer: 'api', producer: 'kiwa-api', module: 'items', example: 'nextjs-api-poc' },
  { layer: 'ui', producer: 'kiwa-ui', module: 'counter', example: 'react-component-poc' },
  { layer: 'data', producer: 'kiwa-data', module: 'orders', example: 'queue-poc' },
  { layer: 'cli', producer: 'kiwa-cli-test', module: 'kiwa-cli', example: 'cli-poc' },
  { layer: 'auth', producer: 'kiwa-auth', module: 'auth-flow', example: 'auth-lucia-poc' },
  { layer: 'cache', producer: 'kiwa-cache', module: 'session-cache', example: 'cache-redis-poc' },
  { layer: 'job-queue', producer: 'kiwa-queue', module: 'queue-flow', example: 'queue-bullmq-poc' },
  { layer: 'orm-query', producer: 'kiwa-orm', module: 'users-repo', example: 'orm-drizzle-sqlite-poc' },
  {
    layer: 'e2e-generic',
    producer: 'kiwa-e2e',
    module: 'reorg-4scenario',
    example: 'dogfood-dapp-e2e-reorg',
  },
  { layer: 'unit', producer: 'kiwa-vitest', module: 'token', example: 'vitest-unit-poc' },
  { layer: 'a11y', producer: 'kiwa-a11y', module: 'counter', example: 'react-component-poc' },
  {
    layer: 'edge-handler',
    producer: 'kiwa-edge',
    module: 'links',
    example: 'edge-handler-poc',
  },
] as const;

function resolveTestPaths(entry: (typeof ROSTER)[number]): {
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
