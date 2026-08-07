import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const REPO_ROOT = repoRoot(HERE);

function read(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

const LAYERS = JSON.parse(read('docs/layers.json')) as {
  layers: { id: string; spec_path: string | null }[];
};

/**
 * Ask the CLI for the same layer twice, once per language.
 *
 * Run through the built binary rather than by importing the function, because
 * what the skills consume is the command's output. A function that resolved
 * correctly while the command dropped the flag would still leave Layer 2
 * looking in the wrong place, which is the shape of #1855.
 */
function specPath(layer: string, lang?: string): string | null {
  const bin = resolve(REPO_ROOT, 'packages/cli/dist/bin.js');
  const args = ['layers', '--json', '--layer', layer];
  if (lang !== undefined) args.push('--lang', lang);
  const out = execFileSync('node', [bin, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  const parsed = JSON.parse(out) as { layers: { id: string; spec_path: string | null }[] };
  return parsed.layers.find((l) => l.id === layer)?.spec_path ?? null;
}

describe('spec path の言語解決が producer と CLI で一致する', () => {
  // `/kiwa-design --lang ja` writes `test-spec-{module}.nextjs.ja.md`; the table
  // declares the plain path. Nothing reconciled the two, and two of the three
  // consumers did not know the convention existed (#1855).
  const DECLARED = LAYERS.layers.filter((l) => l.spec_path !== null);

  it('宣言のある layer が十分にある', () => {
    // A guard against the checks below silently covering nothing.
    expect(DECLARED.length).toBeGreaterThan(20);
  });

  it('--lang 省略時は layers.json の宣言と一致する', () => {
    // The declaration is the English path. If the command moved it without
    // being asked, every caller that does not pass the flag would shift.
    for (const layer of DECLARED.slice(0, 4)) {
      expect(specPath(layer.id), `${layer.id} が宣言と食い違う`).toBe(layer.spec_path);
    }
  });

  it('--lang en も宣言と一致する', () => {
    // Two ways of asking for English have to agree, or a caller that forwards
    // the flag unconditionally gets a third answer.
    const layer = DECLARED[0]!;
    expect(specPath(layer.id, 'en')).toBe(layer.spec_path);
  });

  it('--lang ja が producer の書く path と一致する', () => {
    // The convention lives in `/kiwa-design` § lang suffix 規約: the code goes
    // last, after any layer suffix, before the `.md`.
    for (const layer of DECLARED.slice(0, 4)) {
      const expected = layer.spec_path!.replace(/\.md$/, '.ja.md');
      expect(specPath(layer.id, 'ja'), `${layer.id} の ja path が規約と違う`).toBe(expected);
    }
  });

  it('producer の規約が CLI に委ねると書いている', () => {
    // The rule was written out in two skills. A copy goes stale the moment the
    // CLI changes, which is how `kiwa-review` ended up as the only consumer
    // that knew about the suffix at all.
    const design = read('.claude/skills/kiwa-design/SKILL.md');
    expect(design, 'CLI が同じ規約を実装している旨が無い').toContain('withLangSuffix');
    expect(design).toMatch(/consumer は自前で組み立てず CLI から受け取る/);
  });

  it('consumer が CLI から path を受け取る', () => {
    const review = read('.claude/skills/kiwa-review/SKILL.md');
    // Asserted on the command it runs, not on prose about the rule. The note
    // sat next to a `LANG_SUFFIX` block that was still the actual instruction,
    // so the two paths coexisted and only one of them followed the CLI.
    expect(review, 'CLI から受け取る経路が無い').toMatch(/kiwa layers --json[^\n]*--lang/);
    expect(review, '自前で組み立てない旨が無い').toMatch(/自前で組み立てない/);
  });

  it('consumer が spec path の LANG_SUFFIX を自前で組まない', () => {
    // The report path still builds its own suffix, which is a different file
    // (`tests/reports/review/`) and outside what `kiwa layers` resolves. The
    // spec path is the one that has to come from the CLI.
    const review = read('.claude/skills/kiwa-review/SKILL.md');
    const specSuffix = review
      .split('\n')
      .filter((line) => line.includes('LANG_SUFFIX') && line.includes('test-spec'));
    expect(specSuffix, `spec path を自前で組む行が残っている:\n${specSuffix.join('\n')}`).toEqual([]);
  });

  it('LANG ではなく DOC_LANG を使うと書いてある', () => {
    // `LANG` is the shell locale (`ja_JP.UTF-8` on this machine), so passing it
    // makes the CLI refuse the value. Measured (#1860 Round 1, F1).
    for (const skill of ['kiwa-app', 'kiwa-review']) {
      const body = read(`.claude/skills/${skill}/SKILL.md`);
      expect(body, `${skill} が LANG を使わない旨を書いていない`).toMatch(
        /`LANG` を使わない/,
      );
    }
  });

  it('skill が実際に渡す変数が DOC_LANG である', () => {
    // Asserted on the command, not on the prose beside it. Reverting the
    // command to `${LANG:+--lang "$LANG"}` left the warning in place and every
    // wording check stayed green.
    const app = read('.claude/skills/kiwa-app/SKILL.md');
    const invocation = app
      .split('\n')
      .filter((line) => line.includes('kiwa layers --json'))
      .join('\n');
    expect(invocation, 'kiwa layers の呼出が見つからない').toContain('--lang');
    expect(invocation, '呼出が DOC_LANG を渡していない').toContain('$DOC_LANG');
    expect(invocation, '呼出が shell locale の LANG を渡している').not.toMatch(
      /\$\{LANG[:}]|"\$LANG"/,
    );
  });

  it('入口 skill が --lang を CLI に渡す', () => {
    // Passing it to Layer 1 and Layer 2 but not to `kiwa layers` leaves the
    // spec path unresolved, which is the original defect.
    const app = read('.claude/skills/kiwa-app/SKILL.md');
    expect(app, 'kiwa layers に --lang を渡していない').toMatch(
      /kiwa layers --json[^\n]*--lang/,
    );
    expect(app, 'suffix を足さない旨が無い').toMatch(/suffix を足さない/);
  });
});
