import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const REPO_ROOT = repoRoot(HERE);

const SKILL = readFileSync(
  resolve(REPO_ROOT, '.claude/skills/kiwa-nextjs/SKILL.md'),
  'utf-8',
);

/**
 * The body of a `##`/`###`/`####` section, up to the next heading of the same
 * or shallower depth.
 *
 * Matched as a whole line. Substring matching lets a renamed heading keep the
 * section visible, so a mutation that removes it outright passes (#1853).
 *
 * Fenced blocks are skipped when looking for the end. A shell comment inside a
 * ```bash block starts with `# `, and reading it as a heading cut this section
 * off at its own grep example — the assertions then ran against a fragment and
 * failed for the wrong reason.
 */
function section(heading: string): string {
  const lines = SKILL.split('\n');
  const depth = /^#+/.exec(heading)?.[0].length ?? 0;
  const start = lines.findIndex((line) => line.trim() === heading);
  expect(start, `見出しが 1 行として見つからない: ${heading}`).toBeGreaterThan(-1);

  const body: string[] = [];
  let fenced = false;
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('```')) fenced = !fenced;
    if (!fenced) {
      const hashes = /^(#+)\s/.exec(line)?.[1];
      if (hashes !== undefined && hashes.length <= depth) break;
    }
    body.push(line);
  }
  return body.join('\n');
}

/** The ```ts fenced blocks inside a chunk of markdown. */
function tsBlocks(text: string): string[] {
  return [...text.matchAll(/```ts\n([\s\S]*?)```/g)].map((m) => m[1] ?? '');
}

describe('kiwa-nextjs は data seam を検出して seed する', () => {
  // `invokeServerAction` seeds formData / args / cookies / headers and nothing
  // else. An action reading a module-level store leaks state between cases,
  // and the env-seam check does not notice because the action touches neither
  // redirect nor cookies nor revalidatePath (#1856, measured on a real app).
  it('Step 2 が探す可変 state の形を列挙している', () => {
    const dataSeam = section('#### data seam (seed する軸)');
    for (const form of ['let ', 'new (Map|Set)', '\\[\\]', '\\{\\}']) {
      expect(dataSeam, `探す形の列挙に ${form} が無い`).toMatch(new RegExp(form));
    }
    // The enumeration is worthless without a way to run it.
    expect(dataSeam).toContain('grep');
  });

  it('列挙が 0 件の時は seed 経路を入れないと書いてある', () => {
    const dataSeam = section('#### data seam (seed する軸)');
    // Seeding unconditionally would mean every generated test runs against a
    // mock, and a test that never reaches the implementation cannot fail when
    // the implementation breaks.
    const zeroCase = dataSeam
      .split('\n')
      .filter((line) => line.includes('0 件'));
    expect(zeroCase.join('\n')).toMatch(/入れない|省く/);
  });

  // The defect this whole PR is about: the detection was declared but the
  // generator kept emitting the old template. Three PRs in a row shipped that
  // shape (#1846 / #1848 / #1853), so the pair is asserted, not the detection
  // alone.
  it('Step 3 の template が seed 経路を持つ', () => {
    const blocks = tsBlocks(section('### Step 3: vitest test の生成'));
    expect(blocks.length).toBeGreaterThan(0);
    const template = blocks.join('\n');
    expect(template, 'mock 経路が template に無い').toContain('vi.mock');
    expect(template, 'clear 経路が template に無い').toContain('beforeEach');
    // The reset route needs its import, not just a call in `beforeEach`.
    // Asserting on the identifier alone let a mutation that dropped the import
    // pass, leaving a template that calls a symbol it never brought in.
    expect(template, 'reset 経路の import が template に無い').toMatch(
      /import \{ \{RESET_EXPORT\} \} from/,
    );
  });

  it('Step 3 が seed block を条件付きだと書いている', () => {
    const step3 = section('### Step 3: vitest test の生成');
    // Emitting the block unconditionally is the same defect as never emitting
    // it, in the other direction.
    const conditional = step3
      .split('\n')
      .filter((line) => line.includes('data seam') && !line.startsWith('{'));
    expect(conditional.join('\n')).toMatch(/1 件以上の時だけ|0 件なら/);
  });

  // The helper seeds only its own env in every mode, so a module-level store
  // leaks the same way behind `invokeMiddleware` / `renderServerComponent` /
  // `invokeParallelRoutes` / `setupNextRscEnv`. Fixing only the mode that was
  // measured leaves the other four broken.
  const OTHER_MODES = [
    '## middleware mode (Issue #495、 v1.0.2+)',
    '## RSC mode (Issue #494、 v1.0.3+)',
    '## Parallel Routes mode (Issue #523、 v1.0.4+)',
    '## RSC streaming + Suspense boundary 拡張 (`--layer nextjs-rsc-streaming`、 Issue #558)',
  ];

  it.each(OTHER_MODES)('%s も data seam を省かない', (heading) => {
    expect(section(heading)).toContain('data seam (seed する軸) に従');
  });

  it('5 mode の helper が何を seed するかを 1 表にまとめている', () => {
    const dataSeam = section('#### data seam (seed する軸)');
    for (const helper of [
      'invokeServerAction',
      'invokeMiddleware',
      'renderServerComponent',
      'invokeParallelRoutes',
      'setupNextRscEnv',
    ]) {
      expect(dataSeam, `${helper} が seed 範囲の表に無い`).toContain(helper);
    }
  });

  it('可変 state の形の列挙が file 内で 1 箇所に閉じている', () => {
    // Four mode sections restating the same table is how the declaration and
    // its copies drift apart. They point at the shared section instead.
    const occurrences = SKILL.split('\n').filter((line) =>
      line.includes('可変 object リテラル'),
    );
    expect(occurrences).toHaveLength(1);
  });
});
