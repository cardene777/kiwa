// Skills describe how tests are run, and that description goes stale (#2224).
//
// The speed work of 2026-08 changed the contract: `test` no longer compiles to
// `.vitest-dist`, so for a target without a script that produces it, what sits
// there is a leftover from before. `/kiwa-gap` kept telling the reader to run
// exactly that, and measured 3 checks that had no compiled copy at all as zero.
//
// The contract now lives in one file. These checks keep it from drifting from
// the repository, and keep it from becoming a document nobody reads —
// `_shared/references/component-boundary.md` is referenced by no skill at all,
// which is the same shape as a check nothing runs.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SKILLS_DIR = join(REPO_ROOT, '.claude/skills');
const REFERENCE = join(SKILLS_DIR, '_shared/references/test-execution.md');

/** Every `SKILL.md`, with the name of the skill it belongs to. */
function skills(): { name: string; body: string }[] {
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => ({ name: e.name, path: join(SKILLS_DIR, e.name, 'SKILL.md') }))
    .flatMap(({ name, path }) => {
      try {
        return [{ name, body: readFileSync(path, 'utf-8') }];
      } catch {
        return [];
      }
    });
}

/**
 * Targets whose own scripts still hand `tsconfig.vitest.json` to an emitting
 * `tsc` invocation. Type-only `--noEmit` invocations do not rebuild output.
 *
 * Those are the only ones where `.vitest-dist` is rebuilt, and therefore the
 * only ones where its contents describe the current sources.
 */
function targetsThatEmitCompiledTests(): string[] {
  const found: string[] = [];
  const walk = (dir: string, depth = 1): void => {
    if (depth > 3) return;
    try {
      const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8')) as {
        scripts?: Record<string, string>;
      };
      const compiles = Object.values(manifest.scripts ?? {}).some((script) =>
        script.split(/\s*(?:&&|\|\||;)\s*/).some((command) => {
          const usesVitestProject =
            /\btsc\b/.test(command) &&
            /(?:^|\s)(?:-p|--project)(?:\s+|=)\S*vitest/.test(command);
          const disablesEmit = /(?:^|\s)--noEmit(?:\s|$)/.test(command);
          return usesVitestProject && !disablesEmit;
        }),
      );
      if (compiles) found.push(dir);
    } catch {
      // No manifest here; keep walking.
    }
    let entries: ReturnType<typeof readdirSync> = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true }) as never;
    } catch {
      return;
    }
    for (const e of entries as unknown as { name: string; isDirectory: () => boolean }[]) {
      if (!e.isDirectory() || e.name.startsWith('.') || e.name === 'node_modules') continue;
      walk(join(dir, e.name), depth + 1);
    }
  };
  for (const area of ['packages', 'examples', 'tests']) walk(join(REPO_ROOT, area));
  return found.sort();
}

describe('skill が持つ test 実行の前提 (#2224)', () => {
  it('T-STE-001 skill が .vitest-dist を走らせる形を案内しない', () => {
    const all = skills();
    expect(all.length, 'skill を 1 件も読めていない (検査が空振り)').toBeGreaterThan(10);

    const offenders: string[] = [];
    for (const { name, body } of all) {
      for (const line of body.split('\n')) {
        // 実行する形だけを見る。 除外指定 (`--exclude '**/.vitest-dist/**'`) や
        // 「走らせるな」 と書いた説明文まで止めると、直した記述が落ちる。
        //
        // 語の切れ目は `run` の直後に置く。 `[\s'"`]` を必須にすると
        // `vitest run .vitest-dist/tests` (空白 1 つ) が `\s+` に食われて
        // 一致しない = 直そうとしている当の形をすり抜ける (変異 S1 で実測)。
        if (/\bvitest\s+run\b[^\n]*?(?<![\w/*])\.vitest-dist/.test(line)) {
          offenders.push(`${name}: ${line.trim()}`);
        }
      }
    }
    expect(offenders, `.vitest-dist を走らせる案内が残っている:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('T-STE-002 契約に書いた件数が実物と一致する', () => {
    const body = readFileSync(REFERENCE, 'utf-8');
    const derived = targetsThatEmitCompiledTests();
    expect(derived.length, '`.vitest-dist` を作る target を 1 件も拾えていない (検査が空振り)').toBeGreaterThan(0);

    // 件数を手で書いた以上、実物からずれたら落ちる形にしておく
    // (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。
    const written = [...body.matchAll(/現在 (\d+) 件|作る (\d+) 件/g)].flatMap((m) =>
      [m[1], m[2]].filter(Boolean).map(Number),
    );
    expect(written.length, '契約に件数が書かれていない (この検査が何も見ていない)').toBeGreaterThan(0);
    for (const n of written) {
      expect(n, `契約は ${n} 件と書くが実物は ${derived.length} 件`).toBe(derived.length);
    }
  });

  it('T-STE-003 契約が挙げる skill は実際に参照している', () => {
    const body = readFileSync(REFERENCE, 'utf-8');
    // 「## 参照している skill」 の表から skill 名を取る。
    const listed = [...body.matchAll(/^\| `\/([a-z0-9-]+)` \|/gm)].map((m) => m[1] ?? '');
    expect(listed.length, '契約が skill を 1 件も挙げていない (検査が空振り)').toBeGreaterThan(0);

    const all = new Map(skills().map((s) => [s.name, s.body]));
    const missing = listed.filter((name) => !(all.get(name) ?? '').includes('test-execution.md'));
    expect(missing, `契約に挙げられているのに参照していない: ${missing.join(', ')}`).toEqual([]);

    // 逆向きも見る。 参照しているのに表に無い skill があると、契約の読者一覧が実態とずれる。
    const referencing = [...all.entries()]
      .filter(([, b]) => b.includes('test-execution.md'))
      .map(([name]) => name);
    const unlisted = referencing.filter((name) => !listed.includes(name));
    expect(unlisted, `参照しているのに契約の一覧に無い: ${unlisted.join(', ')}`).toEqual([]);
  });
});
