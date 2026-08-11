import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
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
    expect(DECLARED.length).toBeGreaterThanOrEqual(20);
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
    // Both endings. #1860 wrote `自前で組み立てない` while the block the other
    // 18 skills share says `自前で組み立てず`; requiring only the first would
    // fail the moment `kiwa-review` adopted the shared wording (#1893).
    expect(review, '自前で組み立てない旨が無い').toMatch(/自前で組み立て(ない|ず)/);
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

  /** Skill directories under `.claude/skills/`, whatever they happen to be. */
  function skillNames(): string[] {
    return readdirSync(resolve(REPO_ROOT, '.claude/skills'), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => {
        try {
          read(`.claude/skills/${name}/SKILL.md`);
          return true;
        } catch {
          return false;
        }
      })
      .sort();
  }

  /**
   * The skills that ask the CLI for their spec path.
   *
   * Derived from the files. It was a hand-written list while #1861 moved the
   * consumers in groups, because a derived list would have passed vacuously
   * before the work; now that the migration is complete, naming them means a
   * skill added later joins the silence rather than the checks below.
   *
   * `kiwa-design` is the producer. It writes the spec rather than reading one,
   * and the convention it implements is what the CLI mirrors, so it is not a
   * consumer and does not resolve.
   */
  const MIGRATED = skillNames().filter(
    (name) => name !== 'kiwa-design' && read(`.claude/skills/${name}/SKILL.md`).includes('kiwa layers --json'),
  );

  it.each(MIGRATED)('%s が LANG ではなく DOC_LANG を使うと書いている', (skill) => {
    // `LANG` is the shell locale (`ja_JP.UTF-8` on this machine), so passing it
    // makes the CLI refuse the value. Measured (#1860 Round 1, F1).
    //
    // Applied to every migrated skill, not to the two moved first. Naming them
    // meant a skill migrated later could drop the warning and nothing noticed.
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    expect(body, `${skill} が LANG を使わない旨を書いていない`).toMatch(/`LANG` を使わない/);
  });

  /** The bash blocks a skill declares, concatenated. */
  function bashBlocks(skill: string): string {
    return [...read(`.claude/skills/${skill}/SKILL.md`).matchAll(/```bash\n([\s\S]*?)```/g)]
      .map((m) => m[1] ?? '')
      .join('\n');
  }

  it.each(MIGRATED)('%s が CLI の応答を sed で加工しない', (skill) => {
    // `kiwa-review` piped the response into `sed "s/{module}/$MODULE/"` and
    // survived every check for two passes: the `sed` bans were scoped to the
    // skills the layer table names, and it is not one of them (#1893 Round 1).
    //
    // The substitution is the traversal — a module carrying a separator turns
    // `test-spec-{module}.api.md` into `test-spec-../../etc/passwd.api.md`.
    // Applied to every skill that calls the CLI, whatever the table says.
    const blocks = bashBlocks(skill)
      .split('\n')
      .filter((line) => line.includes('kiwa layers') || line.trim().startsWith('|'));
    expect(blocks.join('\n'), `${skill} が CLI 応答を sed に通している`).not.toContain('sed');
  });

  /**
   * The one bash block in a skill that resolves a spec path, ready to run.
   *
   * Identified by extracting `.spec_path`, which is what the resolution does.
   * Requiring exactly one keeps the runner pointed at a single subject.
   */
  function resolutionSnippet(skill: string): string | null {
    const blocks = [...read(`.claude/skills/${skill}/SKILL.md`).matchAll(/```bash\n([\s\S]*?)```/g)]
      .map((m) => m[1] ?? '')
      .filter((b) => b.includes('.spec_path'));
    if (blocks.length === 0) return null;
    expect(blocks, `${skill} の解決 block が 1 つに定まらない`).toHaveLength(1);
    return blocks[0] ?? null;
  }

  /**
   * Run a resolution snippet against one CLI response and report its exit code.
   *
   * The response is served by a stub `kiwa` placed first on `PATH`, so the
   * snippet runs exactly as written — no substitution, no re-implementation.
   */
  function runResolution(snippet: string, response: string, cliStatus = 0): number {
    const dir = mkdtempSync(join(tmpdir(), 'kiwa-resolve-'));
    try {
      const stub = join(dir, 'kiwa');
      // The exit status is a parameter because the decision table's first row
      // is about status, not shape. With the stub fixed at 0, deleting
      // `|| { ...; exit 1; }` from the snippet went undetected (#1893 Round 5).
      writeFileSync(
        stub,
        `#!/bin/sh\ncat <<'KIWA_JSON'\n${response}\nKIWA_JSON\nexit ${cliStatus}\n`,
        { mode: 0o755 },
      );
      const script = [
        `export PATH=${JSON.stringify(dir)}:$PATH`,
        'TARGET=contract',
        'EXAMPLE=nft',
        'DOC_LANG=ja',
        snippet,
        'exit 0', // ここに到達 = snippet が応答を受理した
      ].join('\n');
      return spawnSync('bash', ['-c', script], { cwd: dir, encoding: 'utf-8' }).status ?? -1;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  /**
   * Every abort row of the decision table, as a response that triggers it.
   *
   * The table is prose the LLM reads; these are the same rows as behaviour.
   */
  const BROKEN_RESPONSES: [string, string][] = [
    ['stdout が JSON として読めない', 'not json at all'],
    ['`layers` が配列でない', '{"layers":{"id":"contract"}}'],
    // The shape the array guard exists for. With `.layers[]?` an object of
    // objects iterates its values, finds one matching `id`, and resolves — the
    // table calls it an abort and it would be accepted. The flatter
    // `{"layers":{"id":...}}` above aborts either way, because indexing a
    // string errors out, so it does not pin the guard on its own (measured).
    [
      '`layers` が object of objects',
      '{"layers":{"contract":{"id":"contract","spec_path":"x.md"}}}',
    ],
    ['必要な `id` が `layers` に無い', '{"layers":[{"id":"e2e","spec_path":"x.md"}]}'],
    [
      '同じ `id` が 2 件以上ある',
      '{"layers":[{"id":"contract","spec_path":"a.md"},{"id":"contract","spec_path":"b.md"}]}',
    ],
    ['`spec_path` が文字列でない', '{"layers":[{"id":"contract","spec_path":42}]}'],
    ['`spec_path` が null', '{"layers":[{"id":"contract","spec_path":null}]}'],
    ['`spec_path` が空', '{"layers":[{"id":"contract","spec_path":""}]}'],
    [
      '`spec_path` に `{module}` が残っている',
      '{"layers":[{"id":"contract","spec_path":"tests/spec/contract/test-spec-{module}.md"}]}',
    ],
  ];

  const VALID_RESPONSE =
    '{"layers":[{"id":"contract","spec_path":"tests/spec/contract/test-spec-nft.ja.md"}]}';

  it.each(MIGRATED)('%s の解決 snippet が壊れた応答で止まる', (skill) => {
    // Executed, not pattern-matched. Three rounds went to text proxies that
    // each had a way through — a `jq -e` elsewhere in the block satisfied a
    // block-wide search (Round 3), and a trailing `# jq -e 'type == "string"'`
    // satisfied a line-wide one (Round 4). Running the snippet cannot be
    // satisfied by a token that does not execute.
    const snippet = resolutionSnippet(skill);
    if (snippet === null) return; // 解決を bash で書いていない skill は対象外

    // `jq` is what the snippet uses. Absent, the check cannot answer, so it
    // fails rather than passing silently.
    expect(
      spawnSync('sh', ['-c', 'command -v jq'], { encoding: 'utf-8' }).status,
      'jq が無いため snippet を実行できない',
    ).toBe(0);

    expect(runResolution(snippet, VALID_RESPONSE), `${skill} が正常な応答を受理しない`).toBe(0);
    for (const [label, response] of BROKEN_RESPONSES) {
      expect(runResolution(snippet, response), `${skill} が「${label}」 で止まらない`).not.toBe(0);
    }
    // The table's first row. Shape cannot express it: the response is valid and
    // the command still failed, which is what an uninstalled CLI or a bad
    // `--module` looks like.
    expect(
      runResolution(snippet, VALID_RESPONSE, 2),
      `${skill} が「exit != 0」 で止まらない`,
    ).not.toBe(0);
    // 11 bash processes, each with its own temp dir. Stated here rather than
    // left to the runner's flag: `pnpm test` passes `--testTimeout 30000` but a
    // bare `vitest run` uses 5000 and this took 5.5s on the machine it was
    // written on, so the check would fail depending on how it was invoked.
  }, 60_000);

  it.each(MIGRATED)('%s が shell 断片に未定義の関数を置かない', (skill) => {
    // A `for LAYER in $(target_layers "$TARGET")` that nothing defines exits
    // the loop zero times and the snippet still succeeds, so the spec check it
    // guards silently covers nothing (#1893 Round 1 F1, measured in bash).
    //
    // Checked as "every command substitution calls something the block or the
    // environment defines", approximated by requiring the callee to appear
    // elsewhere in the block as an assignment, a function, or a known binary.
    const block = bashBlocks(skill);
    const KNOWN = new Set([
      'kiwa', 'jq', 'git', 'ls', 'cat', 'echo', 'printf', 'date', 'basename',
      'dirname', 'pnpm', 'npx', 'node', 'grep', 'sed', 'awk', 'head', 'tail',
      'wc', 'find', 'mktemp', 'command', 'sort', 'uniq',
    ]);
    const called = [...block.matchAll(/\$\(\s*([a-z_][a-z0-9_]*)\b/gi)].map((m) => m[1] ?? '');
    const undefinedCalls = called.filter(
      (name) => !KNOWN.has(name) && !new RegExp(`(^|\\n)\\s*(function\\s+)?${name}\\s*(\\(\\)|=)`).test(block),
    );
    expect(undefinedCalls, `${skill} が未定義の ${undefinedCalls.join(', ')} を呼んでいる`).toEqual([]);
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
   * The layers each Layer 2 skill resolves for, read from the table.
   *
   * The CLI call needs a `--layer`, and none of these skills take one as an
   * argument — the layer follows from which mode the skill was invoked in. A
   * block that says `--layer "$LAYER"` without saying where `$LAYER` comes
   * from is not runnable (#1862 Round 1 asked, and it was not there).
   *
   * Derived from `docs/layers.json` rather than listed. A hand-written copy of
   * the table drifts from it, which is the defect the whole layer contract
   * exists to prevent (#1807 / #1809 / #1810), and it left `kiwa-hardhat`
   * unchecked once already because it reaches `contract` through
   * `also_consumed_by` (#1891 Round 1).
   *
   * Skills the table names no layer for — the entry point `kiwa-app`, the
   * reviewer `kiwa-review`, the orchestrator `kiwa-test`, the Layer 3
   * `kiwa-observe` — are outside these checks by construction: they take the
   * layer as an argument or resolve several, so "the layer this skill is for"
   * is not a property they have.
   */
  const SKILL_LAYERS: Record<string, string[]> = LAYERS.layers.reduce<Record<string, string[]>>(
    (acc, layer) => {
      const row = layer as unknown as { consumer_skill: string | null; also_consumed_by?: string[] };
      for (const skill of [row.consumer_skill, ...(row.also_consumed_by ?? [])]) {
        if (!skill) continue;
        (acc[skill] ??= []).push(layer.id);
      }
      return acc;
    },
    {},
  );

  /**
   * The resolution block of a migrated Layer 2 skill.
   *
   * Ends at the next top-level heading rather than at `## 実行フロー` by name.
   * Not every skill has that section — `kiwa-orm` and `kiwa-edge` go straight
   * from the options to a template — and `indexOf` returning -1 there would
   * slice to one character before the end of the file, pulling every later
   * code block into the block being checked.
   */
  function resolverBlock(skill: string): string {
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    const start = body.indexOf('### 入力 spec の path は CLI から受け取る');
    expect(start, `${skill} に解決 block が無い`).toBeGreaterThan(-1);
    const end = body.indexOf('\n## ', start);
    return body.slice(start, end === -1 ? undefined : end);
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

  it.each(Object.keys(SKILL_LAYERS))('%s の review 起動が --no-review に従う', (skill) => {
    // Declaring an off switch and then giving an unconditional instruction
    // leaves the LLM two readings, and the one it picks runs a review in CI
    // that was explicitly turned off (#1861 群 4 Round 1 F1).
    //
    // Asserted on the invocation line rather than on prose nearby: `kiwa-orm`
    // stated the skip in its option list while the only instruction that
    // starts the review said nothing about it, 40 lines apart.
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    const declared = body.split('\n').some((l) => l.startsWith('- `--no-review`'));
    if (!declared) return; // off switch が無い skill は条件を書きようがない
    expect(reviewInvocation(skill), `${skill} の review 起動が無条件`).toContain('--no-review');
  });

  it.each(Object.keys(SKILL_LAYERS))('%s が review 起動を持つなら off switch も持つ', (skill) => {
    // The other direction. Adding an invocation to a skill that never had one
    // — which 群 4 did for `kiwa-orm` and `kiwa-edge` — takes away the caller's
    // ability to skip it unless the flag is added in the same change.
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    expect(
      body.split('\n').some((l) => l.startsWith('- `--no-review`')),
      `${skill} が review を起動するのに --no-review を宣言していない`,
    ).toBe(true);
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

  it.each(MIGRATED)('%s の spec flag 既定が固定 path でない', (skill) => {
    const body = read(`.claude/skills/${skill}/SKILL.md`);
    // Both spellings. `--spec-path` predates `--input-spec` and five skills
    // still use it, so looking only for the newer name skipped `kiwa-forge`
    // and `kiwa-hardhat` entirely (Round 1 F1).
    //
    // Anchored to the declaration line. A substring match picks up prose that
    // mentions the flag — `kiwa-play` describes `--module` in terms of
    // `--input-spec` two lines earlier — and then asserts on the prose while
    // the real declaration goes unchecked (Round 2 F1, measured).
    const option = body
      .split('\n')
      .find((line) => /^- `--(?:input-spec|spec-path) \{path\}`/.test(line));
    if (option === undefined) return; // 入口 skill と review は spec flag を持たない
    // A hardcoded default is the English path, so `--lang ja` silently points
    // at a file the producer did not write (#1855).
    expect(option, `${skill} の既定が固定 path`).not.toMatch(/省略時は `tests\/spec/);
  });

  it('検査対象が空になっていない', () => {
    // `MIGRATED` and `SKILL_LAYERS` are both derived now, so a bug in the
    // derivation (a renamed directory, a moved heading, a table field) empties
    // them and every `it.each` above silently covers nothing.
    //
    // The floor is the count at the time #1861 finished, not an exact number:
    // adding a skill should not fail this, removing one should.
    expect(MIGRATED.length, `対象 skill: ${MIGRATED.join(', ')}`).toBeGreaterThanOrEqual(20);
    expect(Object.keys(SKILL_LAYERS).length).toBeGreaterThanOrEqual(13);
  });

  it('layer の consumer が全員 CLI から受け取る', () => {
    // Derived from the table on both sides. A layer added with a consumer that
    // never resolves would otherwise be found only when somebody ran it with
    // `--lang ja` and got "spec が無い".
    const missing = Object.keys(SKILL_LAYERS).filter((skill) => !MIGRATED.includes(skill));
    expect(missing, `CLI から受け取らない consumer: ${missing.join(', ')}`).toEqual([]);
  });

  /**
   * Lines that build a spec path instead of asking for one.
   *
   * Four shapes, each one a defect that actually shipped:
   *
   * | # | 形 | 由来 |
   * |---|---|---|
   * | 1 | `--input-spec` 等の既定に固定 path を書く | #1855 — 英語の path なので `--lang ja` で producer が書かない file を指す |
   * | 2 | `LANG_SUFFIX` を持つ行で spec path を組む | #1860 — CLI と 2 経路になり、 規約が変わると取り残される |
   * | 3 | `test-spec-` を shell 変数で組む | #1861 群 5 — `kiwa-test` の Step 2.5 が spec の存在確認をこの形でやっていた |
   * | 4 | option 宣言行に spec path を書く | #1861 群 3-4 — `--module {name}` の説明に「`tests/spec/…` を Read」 と併記する形 |
   *
   * Shape 4 needs the line to be an option declaration. `--input-spec` にも
   * `省略時は` にも当たらない形で 5 skill が持っていた一方、 同じ path を本文で
   * 説明する行は多く、 substring だけで見ると後者まで巻き込む。
   *
   * Prose that *mentions* a path is not an offender. Every migrated skill keeps
   * `tests/spec/…/test-spec-{module}.foo.md` in its frontmatter and 前提 as a
   * description of what it reads, and its resolution block says outright that
   * such notation is illustrative. Banning the substring would force those to
   * be deleted and take the reader's only statement of what the file looks
   * like with them.
   *
   * Measured against the tree as it stood before the migration (`28a6981ec`):
   * 19 lines across 16 skills. Against the tree this change produces: 0.
   */
  function selfAssembledLines(body: string): string[] {
    return body.split('\n').filter((line) => {
      if (/省略時は `tests\/spec/.test(line)) return true;
      if (line.includes('LANG_SUFFIX') && line.includes('tests/spec')) return true;
      if (/test-spec-[^`\n]*(\$\{|\$[A-Z_])/.test(line)) return true;
      if (line.startsWith('- `--') && line.includes('tests/spec')) return true;
      return false;
    });
  }

  it('自前で spec path を組む skill が 0 件である', () => {
    // The sweep #1861 asks for: walks `.claude/skills/` rather than naming
    // consumers, so a skill added after this lands is covered without editing
    // the check. Naming them is what let `kiwa-hardhat` and `kiwa-play` sit
    // unchecked through two earlier passes.
    //
    // `kiwa-design` is excluded as the producer: it writes the spec, so the
    // convention has to be stated somewhere and that somewhere is its own file.
    const offenders = skillNames()
      .filter((name) => name !== 'kiwa-design')
      .flatMap((name) =>
        selfAssembledLines(read(`.claude/skills/${name}/SKILL.md`)).map(
          (line) => `${name}: ${line.trim()}`,
        ),
      );
    expect(offenders, `自前で組む行が残っている:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('producer だけが規約を持つ', () => {
    // The other half. Excluding `kiwa-design` from the sweep is only sound if
    // it is the one file that states the convention — if it stopped, the
    // sweep would pass with the rule written down nowhere.
    const design = read('.claude/skills/kiwa-design/SKILL.md');
    expect(selfAssembledLines(design).length, 'producer が規約を持たない').toBeGreaterThan(0);
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

/**
 * `a{x,y}b` → `axb` / `ayb`。 入れ子は扱わない (`docs/layers.json` に無い)。
 */
function expandBraces(pattern: string): string[] {
  const m = /\{([^{}]*)\}/.exec(pattern);
  if (!m) return [pattern];
  const [whole, inner] = m;
  const head = pattern.slice(0, m.index);
  const tail = pattern.slice(m.index + whole.length);
  return (inner ?? '').split(',').flatMap((alt) => expandBraces(`${head}${alt}${tail}`));
}

/**
 * `base` からの相対 pattern に一致する file 数。
 *
 * shell を使わない。 pattern を `bash -c` の command 文字列へ補間すると、
 * 空白 / `;` / `$()` / backtick / 先頭 dash を含む値が shell 構文として解釈
 * される (#1898 Round 1 F5)。
 *
 * `fs.globSync` も使わない。 Node 22 で追加された API で、 repo は
 * `engines.node` に `>=20.9.0` を宣言している。 Node 20 では import 時点で
 * 落ち、 本 file の全 case が実行前に失敗する (#1898 Round 2 F2)。
 *
 * 対象 pattern は `dir/basename` の 2 段で `*` は basename にしか出ない
 * (`docs/layers.json` の 25 形すべてを実測)。
 */
/**
 * `{example}` を解決する唯一の経路。
 *
 * `replaceAll`。 `e2e` の退避先は `tests/fixtures/{example}/e2e-test/{example}.spec.ts`
 * と 2 度書くため、 先頭 1 つだけ置換すると basename に `{example}` が残り、
 * `expandBraces` が literal `example` に変えて別 pattern を検査する
 * (#1898 Round 6 / Round 7)。
 */
function resolveExample(pattern: string, example: string): string {
  return pattern.replaceAll('{example}', example);
}

function patternToMatchers(pattern: string): { dir: string; regexes: RegExp[] } {
  const expanded = pattern.replace(/\{Contract\}|\{module\}/g, '*');
  const slash = expanded.lastIndexOf('/');
  const dir = slash === -1 ? '.' : expanded.slice(0, slash);
  const baseName = slash === -1 ? expanded : expanded.slice(slash + 1);
  // brace alternative を先に展開する。 escape だけ掛けると `{ts,tsx}` が
  // literal 一致になり、 `.test.ts` も `.test.tsx` も 0 件になる (#1898 Round 3)。
  const regexes = expandBraces(baseName).map(
    (v) =>
      new RegExp(`^${v.replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === '*' ? '.*' : `\\${c}`))}$`),
  );
  return { dir, regexes };
}

function countIn(pattern: string, base: string): number {
  // 変換を先に済ませる。 `readdirSync` を先に呼ぶと、 dir が無い pattern は
  // 早期 return して変換経路に 1 度も到達しない (#1898 Round 4)。
  const { dir, regexes } = patternToMatchers(pattern);
  let names: string[];
  try {
    names = readdirSync(resolve(base, dir));
  } catch {
    return 0; // dir が無い = 0 件
  }
  return names.filter((n) => regexes.some((re) => re.test(n))).length;
}

describe('Layer 3 の観測が chain から起動される (#1894)', () => {
  /**
   * The lines that actually start `/kiwa-observe`, found by walking.
   *
   * The invocation line itself, not the block it sits in. A block-wide search
   * is satisfied by a comment or a sentence that happens to name the flag,
   * which is how three rounds of #1893 went (Round 3 and Round 4 both).
   * Continuations are folded so a wrapped invocation reads as one line.
   */
  function observeInvocations(): { skill: string; line: string }[] {
    return readdirSync(resolve(REPO_ROOT, '.claude/skills'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== 'kiwa-observe')
      .flatMap((e) => {
        let body: string;
        try {
          body = read(`.claude/skills/${e.name}/SKILL.md`);
        } catch {
          return [];
        }
        // Code blocks only. Prose names the skill when explaining the chain,
        // and reading those as invocations would count the flow diagram.
        return [...body.matchAll(/```(?:text|bash)\n([\s\S]*?)```/g)]
          .map((m) => m[1] ?? '')
          .join('\n')
          .replace(/\\\n\s*/g, ' ') // 継続行を 1 論理行に畳む
          .split('\n')
          .filter((line) => !line.trim().startsWith('#'))
          .filter((line) => /(^|\s)\/kiwa-observe(\s|$)/.test(line))
          .map((line) => ({ skill: e.name, line }));
      });
  }

  it('kiwa-observe を起動する skill が 1 件以上ある', () => {
    // `kiwa-observe` was reachable only by hand: nothing in `.claude/skills/`
    // named it. #1861 群 5 then made `--layer` required, so the argument it
    // needs had no one to pass it.
    const callers = observeInvocations();
    expect(callers.map((c) => c.skill), 'kiwa-observe を起動する skill が無い').not.toEqual([]);
  });

  it('起動行が 6 引数すべてを渡す', () => {
    // Each one is a value the caller knows and the callee cannot derive.
    // `--layer` decides which spec to compare against, `--producer` which of
    // two `test_outputs` keys to read (only `contract` has two), `--test` which
    // files were actually run, `--out` keeps one layer from overwriting the
    // next. Asserted on the invocation line, not the block.
    const invocations = observeInvocations();
    expect(invocations.length, '起動行が 0 件').toBeGreaterThan(0);
    for (const { skill, line } of invocations) {
      for (const flag of ['--module', '--layer', '--lang', '--producer', '--test', '--out']) {
        expect(line, `${skill} の kiwa-observe 起動が ${flag} を渡していない`).toContain(flag);
      }
    }
  });

  it('起動行が {$VAR} 形式の変数展開を書いていない', () => {
    // `{$DOC_LANG}` is not a shell expansion: it leaves `{ja}` in the file
    // name, so the path in the report and the file on disk disagree.
    for (const { skill, line } of observeInvocations()) {
      expect(line, `${skill} の起動行が {$VAR} を書いている`).not.toMatch(/\{\$[A-Za-z_]/);
    }
  });

  it('kiwa-observe が渡される 6 引数を宣言している', () => {
    // The other end of the same contract. A caller passing a flag the callee
    // does not declare is accepted and ignored, which is how `--input-spec`
    // behaved before #1851. Matched on the declaration's own line so a flag
    // named only in prose does not satisfy it.
    const lines = read('.claude/skills/kiwa-observe/SKILL.md').split('\n');
    for (const flag of ['--module', '--layer', '--lang', '--producer', '--test', '--out']) {
      const declared = lines.filter((l) => l.startsWith(`- \`${flag} `) || l.startsWith(`- \`${flag}\``));
      expect(declared.length, `kiwa-observe が ${flag} を宣言していない`).toBe(1);
    }
  });

  it('kiwa-observe の --test 既定が test_outputs を名指しする', () => {
    // Stated positively. "does not say 推測" is satisfied by deleting the
    // sentence, which leaves the default undefined rather than resolved
    // (#1895 Round 1 F7).
    const option = read('.claude/skills/kiwa-observe/SKILL.md')
      .split('\n')
      .find((l) => l.startsWith('- `--test '));
    expect(option, '--test の宣言が無い').toBeDefined();
    expect(option, '--test の既定が test_outputs を名指ししていない').toContain('test_outputs');
    expect(option, '--test の既定が推測に戻っている').not.toContain('推測');
  });

  it('kiwa-observe の --out 既定が exact な template である', () => {
    // The exact string, not just "contains {layer}". A default of
    // `dashboard-{layer}.md` would satisfy a containment check while dropping
    // the module and the language from the name.
    const option = read('.claude/skills/kiwa-observe/SKILL.md')
      .split('\n')
      .find((l) => l.startsWith('- `--out '));
    expect(option, '--out の宣言が無い').toBeDefined();
    expect(option, '--out の既定が想定の形でない').toContain(
      'tests/reports/observe/dashboard-{module}-{layer}.{lang}.md',
    );
  });

  /**
   * `--layer` の必須性は宣言行 1 つだけが述べる。
   *
   * #1895 の Round 2-5 が同じ場所を 4 度指している。 宣言が「常に必須」 と言う
   * 一方で本文が条件付きに読める形が残り、 塞ぐたびに別の言い方で戻った。
   *
   * | round | 塞いだ形 | 次に通った形 |
   * |---|---|---|
   * | 2 | 条件付きの本文を書き換え | 同じ契約を別の語順で書く |
   * | 3 | 語順 pattern で検出 | 片側の flag だけで書く |
   * | 4 | 両 flag の union を pin | flag 名を 1 度も書かずに書く |
   *
   * **静的な文字列走査ではこの契約を囲い切れない**。 3 round 続けて同じ root cause
   * だったので、 `rules/quality.md § 契約完備性 checklist § 責務境界` の SPLIT に
   * 従って層を分ける。 ただし #1893 と違い実行できる対象が無い (markdown の契約文
   * そのものが対象) ため、 実行層へ移すのではなく **重複を消して 1 箇所にする**。
   *
   * したがって検査は 2 つに絞る。 宣言行が「常に必須」 と欠落時の扱いの両方を言って
   * いること、 そして `--layer` と `必須` を同じ行に持つ箇所がそれ以外に無いこと。
   *
   * **検査するのはこの 2 token の共起だけで、 「重複が無い」 ことの証明ではない**。
   * 検出する / しないの境界は語であって、 書かれた場所ではない。
   *
   * | 形 | 検出 |
   * |---|---|
   * | 本文 / 表の cell / 箇条書きで `--layer` と `必須` が同じ行 | する |
   * | `必要` / 「要る」 等、 `必須` 以外の語で言い直す | しない |
   * | 「層の指定」 等、 flag 名を書かずに言う | しない |
   * | 別 file から参照する | しない |
   *
   * 下 3 行は塞ごうとして 3 round 失敗した範囲で、 **review が見る境界** として残す。
   */
  it('kiwa-observe が --layer と 必須 を宣言行以外で同じ行に書かない', () => {
    const lines = read('.claude/skills/kiwa-observe/SKILL.md').split('\n');

    const declaration = lines.filter((l) => l.startsWith('- `--layer '));
    expect(declaration, '--layer の宣言行が 1 行に定まらない').toHaveLength(1);
    // 必須性と欠落時の扱いの両方。 片方が本文に残ると、 そちらだけ書き換わって
    // 宣言と食い違う (Round 2 / Round 6 で実際にそうなった)。
    expect(declaration[0], '--layer の宣言が「常に必須」 でない').toContain('**常に必須**');
    expect(declaration[0], '--layer の欠落時の扱いが宣言に無い').toContain('user に確認');

    const stating = lines.filter((l) => l.includes('--layer') && l.includes('必須'));
    expect(stating, `--layer の必須性が 2 箇所以上で述べられている:\n${stating.join('\n')}`).toEqual(
      declaration,
    );
  });

  it('kiwa-observe の --spec 宣言が 1 行あり CLI 解決を指す', () => {
    // Lost when the 8-line union pin came out: deleting the `--spec`
    // declaration passed all 371 cases (#1895 Round 6). Restored as its own
    // positive check rather than by widening the `--layer` one, so the two
    // contracts fail separately.
    const declaration = read('.claude/skills/kiwa-observe/SKILL.md')
      .split('\n')
      .filter((l) => l.startsWith('- `--spec '));
    expect(declaration, '--spec の宣言行が 1 行に定まらない').toHaveLength(1);
    expect(declaration[0], '--spec の既定が解決節を指していない').toMatch(
      /省略時は[^、]*§[^、]+で解決/,
    );
  });

  it('kiwa-observe が producer の鍵を consumer_skill から引かない', () => {
    // `contract` declares `kiwa-forge` as `consumer_skill` and `kiwa-hardhat`
    // in `also_consumed_by`. Deriving the `test_outputs` key from
    // `consumer_skill` looks at the Foundry output even when Hardhat ran, and
    // resolves to zero matches (#1895 Round 1 F3).
    const body = read('.claude/skills/kiwa-observe/SKILL.md');
    expect(body, 'consumer_skill を鍵に使わない旨が無い').toMatch(
      /`consumer_skill` を鍵として使わない/,
    );
  });

  it('test_outputs の 2 形が実 example のどちらかで必ず解決する', () => {
    // The two forms are the same test before and after `/kiwa-test` Step 5.5
    // moves it from `examples/` into `tests/fixtures/`, so exactly one of them
    // exists at any moment (`docs/layers.json` の `$comment` が SSOT).
    //
    // #1895 kept only the first and called the second "a copy made after the
    // run". Measured on `mint-nft`, which is already moved: the first form
    // matched 0 files and the second matched 1, so the resolution aborted for
    // every existing example (#1896).
    //
    // Run against the repository rather than asserted on prose: this is the
    // defect a documentation review could not see.
    //
    // **これが確かめるのは「2 形のどちらかが実在する」 ことだけ**。 resolver は
    // skill の markdown にしかなく、 ここにあるのはその再実装なので、 両方存在時に
    // 生成先を優先する契約も、 実行側が片方を捨てる変更も検出しない (#1898
    // Round 1 F3)。 塞ぐには解決を CLI へ寄せて実装を 1 つにする必要があり、
    // それは #1899 に分けた。
    const resolve2 = (pattern: string, example: string): string => {
      if (pattern.startsWith('tests/fixtures/')) {
        return resolveExample(pattern, example);
      }
      // 生成先は `examples/` 起点。 repo root 相対にすると存在しない path になる。
      return `examples/${resolveExample(pattern, example)}`;
    };
    // shell を使わない。 pattern を `bash -c` の command 文字列へ補間すると、
    // 空白 / `;` / `$()` / backtick / 先頭 dash を含む値が shell 構文として
    // 解釈される (#1898 Round 1 F5)。
    //
    // `fs.globSync` も使わない。 Node 22 で追加された API で、 repo は
    // `engines.node` に `>=20.9.0` を宣言している。 Node 20 では import 時点で
    // 落ち、 本 file の全 case が実行前に失敗する (#1898 Round 2 F2)。
    //
    const globCount = (pattern: string): number => countIn(pattern, REPO_ROOT);

    // `contract` は 2 形を持ち、 かつ実 fixture が repo にある layer。
    const contract = LAYERS.layers.find((l) => l.id === 'contract') as unknown as {
      test_outputs: Record<string, string[]>;
    };
    const patterns = contract.test_outputs['kiwa-forge'] ?? [];
    expect(patterns.length, 'contract/kiwa-forge が 2 形を宣言していない').toBe(2);

    const example = 'mint-nft'; // tests/fixtures に実体がある
    const counts = patterns.map((p) => globCount(resolve2(p, example)));
    expect(
      counts.reduce((a, b) => a + b, 0),
      `${example} でどちらの形も 0 件 match: ${patterns.join(' / ')}`,
    ).toBeGreaterThan(0);
  });

  it('kiwa-observe が analyzeSpecCoverage に module と layer を渡す', () => {
    // Omitting them makes the analyser fall back to `module: ""` and
    // `layer: "unit"`, so a `contract` observation is recorded as a unit one —
    // the identity the whole `--layer` wiring exists to carry (#1896, measured
    // by running the script against `mint-nft`).
    const call = read('.claude/skills/kiwa-observe/SKILL.md')
      .replace(/\n\s*/g, ' ') // 折返しを畳む
      .match(/analyzeSpecCoverage\(\{[^}]*\}/);
    expect(call, 'analyzeSpecCoverage の呼出が見つからない').not.toBeNull();
    expect(call?.[0], 'module を渡していない').toContain('module');
    expect(call?.[0], 'defaultLayer を渡していない').toContain('defaultLayer');
  });

  it('kiwa-observe が renderDashboard に表示用の gaps を渡す', () => {
    // `defaultLayer` accepts 8 of the 20 layers, so the other 12 come back with
    // the analyser's default (`unit`) and `renderDashboard` prints that in the
    // `### module (layer)` heading. Measured: with `a11y` the old path rendered
    // `### mint-nft (unit)` and the new one renders `### mint-nft (a11y)`
    // (#1898 Round 2 F1).
    //
    // Asserted on the argument, not on the comment beside it: assigning the
    // real layer to a variable and not using it is exactly what shipped.
    const call = read('.claude/skills/kiwa-observe/SKILL.md')
      .split('\n')
      .filter((l) => l.includes('renderDashboard(') && !l.trim().startsWith('//'));
    expect(call, 'renderDashboard の呼出が 1 行に定まらない').toHaveLength(1);
    expect(call[0], 'renderDashboard が解析側の gaps をそのまま受けている').toContain(
      'gaps: displayGaps',
    );
  });

  it('kiwa-observe が空の解析結果を gap 0 件と書かない', () => {
    // `analyzeSpecCoverage` reads `T-XXX-NNN` ids; a spec written with
    // `TC-NNN` yields zero on both sides, which renders identically to full
    // coverage. Measured on `test-spec-mint-nft.ja.md` (#1896).
    const body = read('.claude/skills/kiwa-observe/SKILL.md');
    expect(body, '空の結果と gap 0 件の区別が書かれていない').toMatch(
      /解析できなかった/,
    );
  });

  it('brace 形の pattern が両 variant を数える', () => {
    // `{example}/test/unit/{module}.test.{ts,tsx}` is the one pattern of 25
    // with a brace alternative. Escaping it as a literal made `.test.ts` and
    // `.test.tsx` both count 0 — latent today because the helper is only
    // handed the two `contract` patterns (#1898 Round 3).
    expect(expandBraces('x.test.{ts,tsx}'), 'brace が展開されない').toEqual([
      'x.test.ts',
      'x.test.tsx',
    ]);

    // 実 file で数える。 展開だけ正しくても照合側が literal なら 0 件になる。
    const dir = mkdtempSync(join(tmpdir(), 'kiwa-brace-'));
    try {
      mkdirSync(join(dir, 'unit'), { recursive: true });
      writeFileSync(join(dir, 'unit', 'signup.test.ts'), '');
      writeFileSync(join(dir, 'unit', 'signup.test.tsx'), '');
      writeFileSync(join(dir, 'unit', 'signup.test.js'), ''); // 対象外
      expect(countIn('unit/{module}.test.{ts,tsx}', dir), 'brace 形が両 variant を数えない').toBe(
        2,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }

    // 25 pattern の変換経路を直接見る。 `countIn` 越しに流すと、 repo に
    // 無い dir で `readdirSync` の catch に落ち、 regex の compile に 1 件も
    // 到達しない (#1898 Round 4)。
    const all = LAYERS.layers.flatMap((l) =>
      Object.values(
        (l as unknown as { test_outputs?: Record<string, string[]> }).test_outputs ?? {},
      ).flat(),
    );
    expect(all.length, '表の pattern 件数が減った').toBeGreaterThanOrEqual(25);
    expect(
      all.some((p) => p.includes('{ts,tsx}')),
      'brace 形の pattern が表から消えた',
    ).toBe(true);
    // 到達確認だけ。 `regexes.length > 0` は `expandBraces` が必ず 1 件以上
    // 返すため恒真で、 正しさの根拠にはならない (#1898 Round 5)。
    for (const p of all) {
      const resolved = resolveExample(p, 'x');
      expect(resolved, `${p} に placeholder が残っている`).not.toContain('{example}');
      expect(() => patternToMatchers(resolved), `${p} で例外`).not.toThrow();
    }
  });

  /**
   * 構文 class ごとの matcher 契約。
   *
   * `dir` と「一致すべき名前」 と「一致してはいけない名前」 を直接 assert する。
   * compile できることだけを見る形は、 wildcard / literal escape / dir 分割を
   * 壊す変更を素通しする (#1898 Round 5)。
   *
   * 5 class は `docs/layers.json` の 25 pattern に現れる形を代表させたもの。
   */
  const MATCHER_CASES: {
    label: string;
    pattern: string;
    dir: string;
    hit: string[];
    miss: string[];
  }[] = [
    {
      label: 'basename の * (contract 生成先)',
      pattern: 'x/test/*.t.sol',
      dir: 'x/test',
      hit: ['MintNft.t.sol', '.t.sol'],
      miss: ['MintNft.t.solx', 'MintNft.test.ts'],
    },
    {
      label: '{Contract} → * (contract 退避先)',
      pattern: 'tests/fixtures/x/contract-test/{Contract}.t.sol',
      dir: 'tests/fixtures/x/contract-test',
      hit: ['Foo.t.sol'],
      miss: ['Foo.t.sol.bak', 'Foo.test.cjs'],
    },
    {
      label: '{module} → * + suffix (orm)',
      pattern: 'x/tests/{module}.orm.test.ts',
      dir: 'x/tests',
      hit: ['signup.orm.test.ts'],
      miss: ['signup.test.ts', 'signup.orm.test.tsx'],
    },
    {
      label: 'brace alternative (unit)',
      pattern: 'x/test/unit/{module}.test.{ts,tsx}',
      dir: 'x/test/unit',
      hit: ['signup.test.ts', 'signup.test.tsx'],
      miss: ['signup.test.js', 'signup.spec.ts'],
    },
    {
      label: 'literal の dot が escape される',
      pattern: 'x/tests/{module}.edge.test.ts',
      dir: 'x/tests',
      hit: ['a.edge.test.ts'],
      miss: ['axedgextestxts'],
    },
    {
      // raw manifest 形のまま持ち、 置換を helper に通す。 置換後の形を
      // hardcode すると `resolveExample` を 1 度も通らず、 `replaceAll` を
      // `replace` に戻しても緑のままになる (#1898 Round 7)。
      label: 'wildcard を持たない exact basename (e2e 退避先)',
      pattern: 'tests/fixtures/{example}/e2e-test/{example}.spec.ts',
      dir: 'tests/fixtures/x/e2e-test',
      hit: ['x.spec.ts'],
      // `prefixx.spec.ts` は開始 anchor が無いと通る。 `example.spec.ts` は
      // 2 つ目の `{example}` が置換されず literal `example` になった時に通る。
      // どちらも wildcard を持つ 4 class では区別が付かない (#1898 Round 6)。
      miss: ['prefixx.spec.ts', 'example.spec.ts', 'x.spec.ts.bak'],
    },
  ];

  it.each(MATCHER_CASES)('$label の matcher が dir と名前を正しく決める', (c) => {
    const resolved = resolveExample(c.pattern, 'x');
    expect(resolved, `${c.pattern} に placeholder が残っている`).not.toContain('{example}');
    const { dir, regexes } = patternToMatchers(resolved);
    expect(dir, `${c.pattern} の dir`).toBe(c.dir);
    for (const name of c.hit) {
      expect(regexes.some((re) => re.test(name)), `${name} に一致しない`).toBe(true);
    }
    for (const name of c.miss) {
      expect(regexes.some((re) => re.test(name)), `${name} に一致してしまう`).toBe(false);
    }
  });

  it('kiwa-observe が 2 形の片方を落とす規則を書いていない', () => {
    // The rule that caused #1896. Stated as an absence because the positive
    // form ("存在する方を採る") can be written many ways, while the defect has
    // one shape: dropping `tests/fixtures/` unconditionally.
    const body = read('.claude/skills/kiwa-observe/SKILL.md');
    const dropping = body
      .split('\n')
      .filter((l) => l.includes('tests/fixtures/') && /落と(す|し)/.test(l));
    expect(dropping, `2 形の片方を落とす記述が残っている:\n${dropping.join('\n')}`).toEqual([]);
  });

  it('鍵が 2 つある layer は contract だけである', () => {
    // The premise the resolution rule rests on. If another layer grew a second
    // producer, `--producer` would become required in more places and the
    // caller's table would be incomplete.
    const multi = LAYERS.layers
      .map((l) => l as unknown as { id: string; test_outputs?: Record<string, string[]> })
      .filter((l) => Object.keys(l.test_outputs ?? {}).length > 1)
      .map((l) => l.id);
    expect(multi, '鍵が 2 つ以上ある layer が contract 以外にある').toEqual(['contract']);
  });
});
