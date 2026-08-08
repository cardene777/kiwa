import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
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

  /**
   * The skills migrated onto the CLI path so far.
   *
   * Listed rather than derived, because migration is staged (#1861 moves 20
   * consumers in four groups) and a derived list would either pass vacuously
   * before the work or fail for skills nobody has reached yet.
   *
   * A skill is added here when its group lands. What the check itself asserts
   * is derived from the file, so adding a name is the only edit needed.
   */
  const MIGRATED = [
    // #1860
    'kiwa-app',
    'kiwa-review',
    // #1861 群 1
    'kiwa-nextjs',
    'kiwa-api',
    'kiwa-ui',
    // #1861 群 2
    'kiwa-vitest',
    'kiwa-e2e',
    'kiwa-a11y',
    'kiwa-data',
    'kiwa-cli-test',
  ];

  it.each(MIGRATED)('%s が LANG ではなく DOC_LANG を使うと書いている', (skill) => {
    // `LANG` is the shell locale (`ja_JP.UTF-8` on this machine), so passing it
    // makes the CLI refuse the value. Measured (#1860 Round 1, F1).
    //
    // Applied to every migrated skill, not to the two moved first. Naming them
    // meant a skill migrated later could drop the warning and nothing noticed.
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    expect(body, `${skill} が LANG を使わない旨を書いていない`).toMatch(/`LANG` を使わない/);
  });

  it.each(MIGRATED)('%s が CLI から spec path を受け取る', (skill) => {
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    // Asserted on the command, not on prose about the rule. `kiwa-review` had
    // a note next to a `LANG_SUFFIX` block that was still the real instruction.
    const invocation = body
      .split('\n')
      .filter((line) => line.includes('kiwa layers --json'))
      .join('\n');
    expect(invocation, `${skill} が kiwa layers を呼んでいない`).toContain('--lang');
  });

  /**
   * The layers each migrated Layer 2 skill resolves for.
   *
   * The CLI call needs a `--layer`, and none of these skills take one as an
   * argument — the layer follows from which mode the skill was invoked in. A
   * block that says `--layer "$LAYER"` without saying where `$LAYER` comes
   * from is not runnable (#1862 Round 1 asked, and it was not there).
   */
  const SKILL_LAYERS: Record<string, string[]> = {
    'kiwa-nextjs': [
      'nextjs-server-action',
      'nextjs-middleware',
      'nextjs-rsc',
      'nextjs-parallel-route',
      'nextjs-rsc-streaming',
    ],
    'kiwa-api': ['integration', 'api'],
    'kiwa-ui': ['ui'],
    'kiwa-vitest': ['unit'],
    'kiwa-e2e': ['e2e-generic'],
    'kiwa-a11y': ['a11y'],
    'kiwa-data': ['data'],
    'kiwa-cli-test': ['cli'],
  };

  /** The resolution block of a migrated Layer 2 skill. */
  function resolverBlock(skill: string): string {
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    const start = body.indexOf('### 入力 spec の path は CLI から受け取る');
    expect(start, `${skill} に解決 block が無い`).toBeGreaterThan(-1);
    return body.slice(start, body.indexOf('## 実行フロー', start));
  }

  it.each(Object.keys(SKILL_LAYERS))('%s が sed で module を置換しない', (skill) => {
    // The `sed` was the traversal: a module carrying a separator turned
    // `test-spec-{module}.ui.md` into `test-spec-../../etc/passwd.ui.md`
    // (measured). Substitution moved into the CLI, which validates the name.
    // Asserted on the command, not on the section. The prose explaining why the
    // `sed` was removed contains the word, so a section-wide check fails on the
    // explanation rather than on a real leftover.
    const command = [...resolverBlock(skill).matchAll(/```bash\n([\s\S]*?)```/g)]
      .map((m) => m[1] ?? '')
      .join('\n');
    expect(command, `${skill} に解決 command が無い`).toContain('kiwa layers');
    expect(command, `${skill} の command が sed を残している`).not.toContain('sed');
    expect(command, `${skill} の command が --module を渡していない`).toContain('--module');
  });

  it.each(Object.keys(SKILL_LAYERS))('%s が解決失敗で止まると書いている', (skill) => {
    // Swallowing the failure means reading an empty path and reporting "no
    // spec", which hides the real cause (wrong layer / bad module / no CLI).
    // Asserted on the decision table, not on the section. The prose above it and
    // the table below say the same words, so either check alone stayed green
    // when the instruction itself was replaced.
    // Scoped to the table's own subsection. The mode-to-layer table above it
    // also has rows mentioning layer ids, and counting both made the check
    // depend on how many modes a skill happens to have.
    const blockBody = resolverBlock(skill);
    const tableStart = blockBody.indexOf('#### 解決に失敗したら止める');
    expect(tableStart, `${skill} に失敗時の節が無い`).toBeGreaterThan(-1);
    const tableEnd = blockBody.indexOf('####', tableStart + 1);
    const rows = blockBody
      .slice(tableStart, tableEnd === -1 ? undefined : tableEnd)
      .split('\n')
      .filter((line) => line.startsWith('|') && !line.startsWith('|---'))
      .slice(1); // header を除く
    expect(rows.length, `${skill} の失敗時の判定表が足りない:\n${rows.join('\n')}`).toBe(8);
    expect(
      rows.filter((r) => r.includes('中断')).length,
      `${skill} の判定表に中断の行が足りない`,
    ).toBe(7);
    // Parsing is not validating. A partially broken response parses fine and
    // then produces a path built from whatever happened to be there.
    const table = rows.join('\n');
    for (const shape of ['配列でない', '2 件以上', '{module}']) {
      expect(table, `${skill} の判定表に「${shape}」 の行が無い`).toContain(shape);
    }
    // `null` alone lets an empty string or a number through. The row has to
    // say what a usable value looks like, not just one way of missing.
    expect(table, `${skill} が spec_path の型を見ていない`).toMatch(/文字列でない、 または空/);
    // The distinction is the point of the whole table: parsing succeeds on a
    // partially broken response, and the rows below only matter if the reader
    // knows that.
    expect(blockBody, `${skill} が「読める」 と「形をしている」 を分けていない`).toMatch(
      /parse できることは/,
    );
    // Counting rows would call the 30-layer form abnormal. The block also tells
    // callers to resolve all five modes in one call, so the two would contradict.
    expect(blockBody, `${skill} が件数で判定している`).toMatch(/件数ではなく/);
    expect(blockBody, `${skill} に絞り込みの手順が無い`).toContain('select(.id ==');
  });

  it('3 skill の判定表が同一である', () => {
    // The table is the same contract in three places. Measured identical by
    // hash today, but nothing kept it that way — a fix applied to one would
    // leave the other two behind, which is the drift this whole Issue is about.
    const tables = Object.keys(SKILL_LAYERS).map((skill) => {
      const blockBody = resolverBlock(skill);
      const start = blockBody.indexOf('#### 解決に失敗したら止める');
      const end = blockBody.indexOf('####', start + 1);
      return blockBody
        .slice(start, end === -1 ? undefined : end)
        .split('\n')
        .filter((line) => line.startsWith('|'))
        .join('\n');
    });
    for (const table of tables.slice(1)) {
      expect(table, '判定表が skill ごとに違う').toBe(tables[0]);
    }
  });

  it.each(Object.keys(SKILL_LAYERS))('%s が曖昧な時に推測しないと書いている', (skill) => {
    // None of these skills take `--layer`, so the layer follows from the mode.
    // Guessing picks a different spec and generates tests for another helper.
    if ((SKILL_LAYERS[skill] ?? []).length < 2) return; // 単一 layer なら曖昧さが無い
    // Asserted on the sentence that gives the instruction. `推測` also appears
    // in the note about `$MODULE`, so matching the word anywhere in the block
    // stayed green when the instruction was deleted.
    const instruction = resolverBlock(skill)
      .split('\n')
      .filter((line) => line.includes('user に確認'));
    expect(instruction.join('\n'), `${skill} に user 確認の指示が無い`).toMatch(
      /判らない時|判らなければ/,
    );
  });

  /**
   * The line that actually starts `/kiwa-review`, not prose that mentions it.
   *
   * Identified by carrying `--mode` or `--layer`: the prose in `kiwa-nextjs`
   * says "Step 6 の `/kiwa-review --mode test-review` は..." while explaining
   * the cover rate, and picking the first mention read that as the invocation.
   */
  function reviewInvocation(skill: string): string {
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    // Identified by `--module`: the invocation passes one, while the prose that
    // explains the cover rate and the 関連 list that names the downstream skill
    // do not. Joining several candidates let a missing flag on the real line be
    // satisfied by another (#1863 Round 2).
    const lines = body
      .split('\n')
      .filter((l) => /`\/kiwa-review[^`]*--module/.test(l))
      .filter((l) => !l.includes('同じ layer'));
    expect(lines, `${skill} の review 起動行が 1 行に定まらない:\n${lines.join('\n')}`)
      .toHaveLength(1);
    return lines[0] ?? '';
  }

  it.each(Object.keys(SKILL_LAYERS))('%s の review 起動が layer と lang を渡す', (skill) => {
    // Resolving the spec for one layer and language, then reviewing against
    // another, compares the generated test to a different input (#1863 F2).
    const invocation = reviewInvocation(skill);
    expect(invocation, `${skill} の review 起動に --layer が無い`).toContain('--layer');
    expect(invocation, `${skill} の review 起動に --lang が無い`).toContain('--lang');
  });

  it.each(Object.keys(SKILL_LAYERS))('%s が --lang を option として宣言している', (skill) => {
    // Using `$DOC_LANG` without declaring the flag leaves callers no way to set
    // it, and no stated default when they do not (#1863 F2).
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    const declared = body.split('\n').filter((l) => l.startsWith('- `--lang '));
    expect(declared.length, `${skill} が --lang を宣言していない`).toBe(1);
    // The same default across skills, not just "some default". Three policies
    // coexisted (`--input-spec` から自動判定 / Step 0 で AskUserQuestion /
    // 起動元の値) and a caller could not tell which applied (#1863 Round 2).
    expect(declared[0], `${skill} の --lang 既定が揃っていない`).toContain(
      '省略時は起動元が渡した値、 単体起動なら `ja`',
    );
    // The option and the step that reads it have to agree. `kiwa-api` and
    // `kiwa-vitest` declared the unified default while Step 0 still asked with
    // AskUserQuestion when the flag was absent (#1863 Round 2 retry).
    const step0 = body.split('\n').filter((l) => l.includes('文書生成言語'));
    if (step0.length > 0) {
      const section = body.slice(body.indexOf(step0[0] ?? ''));
      const head = section.slice(0, section.indexOf('\n### ', 1));
      expect(head, `${skill} の Step 0 が既定と矛盾する`).not.toContain('AskUserQuestion で');
    }
  });

  it.each(Object.keys(SKILL_LAYERS))('%s が存在しない option を案内していない', (skill) => {
    // `/kiwa-test --layer e2e-generic` was written in a 関連 list, but
    // `kiwa-test` takes no `--layer` (measured: 0 declarations). Pointing at a
    // flag that does not exist sends the reader to a command that errors.
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    const kiwaTest = body.split('\n').filter((l) => l.includes('/kiwa-test'));
    for (const line of kiwaTest) {
      expect(line, `${skill} が kiwa-test に --layer を案内している`).not.toMatch(
        /\/kiwa-test[^`\n]*--layer/,
      );
    }
  });

  it.each(Object.keys(SKILL_LAYERS))('%s が layer ID を混在させていない', (skill) => {
    // `kiwa-e2e` resolved `e2e-generic` while its upstream, review and chain
    // lines still said `e2e` — a different layer with a different spec dir
    // (`tests/spec/e2e/` vs `tests/spec/integration/`), measured (#1863 F1).
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    const expected = new Set(SKILL_LAYERS[skill] ?? []);
    const named = [...body.matchAll(/--layer ([a-z][a-z0-9-]*)/g)].map((m) => m[1] ?? '');
    for (const layer of named) {
      expect(expected.has(layer), `${skill} が別 layer (${layer}) を指している`).toBe(true);
    }
  });

  it.each(Object.keys(SKILL_LAYERS))('%s が解決した値を下流 review に渡すと書いている', (skill) => {
    // Reviewing a different spec than the one generated from is the same drift
    // in the other direction (#1862 Round 1, F2).
    const blockBody = resolverBlock(skill);
    expect(blockBody, `${skill} に下流伝播の指示が無い`).toContain('kiwa-review');
  });

  it.each(Object.keys(SKILL_LAYERS))('%s が扱う layer を block が名指ししている', (skill) => {
    const blockBody = resolverBlock(skill);
    for (const layer of SKILL_LAYERS[skill] ?? []) {
      expect(blockBody, `${skill} の block が ${layer} を名指ししていない`).toContain(layer);
    }
  });

  it.each(Object.keys(SKILL_LAYERS))('%s の command が別 layer を指していない', (skill) => {
    // Containment alone passes when the command names a different layer and the
    // right one appears in prose. Swapping `--layer a11y` for `--layer ui` in
    // kiwa-a11y went unnoticed that way (measured).
    const expected = SKILL_LAYERS[skill] ?? [];
    // Scoped to the command block. The prose names layers too (`kiwa-api`
    // explains which `/kiwa-design --layer` produced the spec), and a
    // section-wide scan reads those as the command's own target.
    const command = [...resolverBlock(skill).matchAll(/```bash\n([\s\S]*?)```/g)]
      .map((m) => m[1] ?? '')
      .join('\n');
    const named = [...command.matchAll(/--layer (\S+)/g)]
      .map((m) => m[1] ?? '')
      .filter((l) => !l.startsWith('"')); // `--layer "$LAYER"` は表で解決する形
    for (const layer of named) {
      expect(expected, `${skill} の command が ${layer} を指している`).toContain(layer);
    }
  });

  it.each(Object.keys(SKILL_LAYERS))('%s が名指しする layer が実在する', (skill) => {
    // A layer the table does not declare would make `kiwa layers --layer` exit
    // 2, so the block would be unrunnable in a way no wording check sees.
    const declared = new Set(LAYERS.layers.map((l) => l.id));
    for (const layer of SKILL_LAYERS[skill] ?? []) {
      expect(declared.has(layer), `${layer} が docs/layers.json に無い`).toBe(true);
    }
  });

  it.each(MIGRATED)('%s が spec path の LANG_SUFFIX を自前で組まない', (skill) => {
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    // The report path (`tests/reports/`) builds its own suffix and is outside
    // what `kiwa layers` resolves, so only the spec path is checked.
    const offenders = body
      .split('\n')
      .filter((line) => line.includes('LANG_SUFFIX') && line.includes('test-spec'));
    expect(offenders, `自前で組む行が残っている:\n${offenders.join('\n')}`).toEqual([]);
  });

  it.each(MIGRATED)('%s の --input-spec 既定が固定 path でない', (skill) => {
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    const option = body.split('\n').find((line) => line.includes('`--input-spec'));
    if (option === undefined) return; // 入口 skill と review は --input-spec を持たない
    // A hardcoded default is the English path, so `--lang ja` silently points
    // at a file the producer did not write (#1855).
    expect(option, `${skill} の既定が固定 path`).not.toMatch(/省略時は `tests\/spec/);
  });

  it('移行済 skill の数が Issue の群と一致する', () => {
    // A guard against the list drifting: two from #1860, three in group 1,
    // five in group 2.
    expect(MIGRATED).toHaveLength(10);
  });

  it('未移行の skill が残っていることを記録する', () => {
    // Not a failure — the migration is staged. Asserted so the count moving to
    // zero is visible rather than something to notice by hand.
    const skills = readdirSync(resolve(REPO_ROOT, '.claude/skills'));
    const remaining = skills.filter((name) => {
      if (MIGRATED.includes(name) || name === 'kiwa-design') return false;
      try {
        const body = read(`.claude/skills/${name}/SKILL.md`);
        return /省略時は `tests\/spec/.test(body);
      } catch {
        return false;
      }
    });
    // #1861 群 2-4. Recorded, not required to be empty.
    expect(remaining.length, `未移行: ${remaining.join(', ')}`).toBeLessThanOrEqual(20);
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
