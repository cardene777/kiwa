import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const REPO_ROOT = repoRoot(HERE);

function read(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

/**
 * The layer contract, checked against the filesystem it names.
 *
 * This file used to parse the routing out of prose in three `SKILL.md` files.
 * That was a stopgap and it leaked: ten rows named a cargo/go package where the
 * check expected a skill, one carried arguments inside its backticks, and all
 * eleven passed unexamined — a third of the table.
 *
 * `docs/layers.json` is now the declaration and `scripts/rebuild-layer-routing.mjs`
 * renders it into the skills, so the assertions below read the table rather than
 * the rendering. What remains to check is whether the table's references resolve,
 * and whether the rendering is current.
 */

interface Layer {
  id: string;
  spec_dir: string;
  spec_path: string;
  runtime: string;
  consumer_skill: string;
  also_consumed_by: string[];
  backing_package: string | null;
  backing_runtime_package: string | null;
  providers: string[];
  variants: string[];
  selected_by: string | null;
  mode?: string;
  test_outputs: Record<string, string[]>;
  targets: string[];
}

const table = JSON.parse(read('docs/layers.json')) as { specRoot: string; layers: Layer[] };
const LAYERS = table.layers;

function skillDirs(): Set<string> {
  return new Set(
    readdirSync(resolve(REPO_ROOT, '.claude/skills'), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name),
  );
}

describe('docs/layers.json resolves against the repository', () => {
  it('every consumer_skill has a SKILL.md', () => {
    // A directory alone is not enough. `packages/visual` and
    // `packages/solidstart` survive as untracked build output after #1804
    // deleted them, and the package checks in this suite already learned to
    // look for the manifest instead of the directory.
    const missing = LAYERS.filter(
      (l) => !existsSync(resolve(REPO_ROOT, `.claude/skills/${l.consumer_skill}/SKILL.md`)),
    ).map((l) => `${l.id} -> /${l.consumer_skill}`);
    expect(missing).toEqual([]);
  });

  it('every also_consumed_by skill has a SKILL.md', () => {
    const missing: string[] = [];
    for (const l of LAYERS) {
      for (const skill of l.also_consumed_by) {
        if (!existsSync(resolve(REPO_ROOT, `.claude/skills/${skill}/SKILL.md`))) {
          missing.push(`${l.id} -> /${skill}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('every backing_package is a package docs/libraries.json lists', () => {
    const libraries = JSON.parse(read('docs/libraries.json')) as {
      libraryCategories: { packages: string[] }[];
    };
    const known = new Set(libraries.libraryCategories.flatMap((c) => c.packages));
    const missing = LAYERS.filter((l) => l.backing_package && !known.has(l.backing_package)).map(
      (l) => `${l.id} -> ${l.backing_package}`,
    );
    expect(missing).toEqual([]);
  });

  it('every backing_package has a directory under packages/', () => {
    const missing = LAYERS.filter(
      (l) => l.backing_package && !existsSync(resolve(REPO_ROOT, `packages/${l.backing_package}/package.json`)),
    ).map((l) => `${l.id} -> packages/${l.backing_package}`);
    expect(missing).toEqual([]);
  });

  it('every spec_dir exists under the spec root', () => {
    const missing = [...new Set(LAYERS.map((l) => l.spec_dir))].filter(
      (dir) => !existsSync(resolve(REPO_ROOT, `${table.specRoot}/${dir}`)),
    );
    expect(missing).toEqual([]);
  });
});

describe('docs/layers.json is internally consistent', () => {
  it('ids are unique', () => {
    const ids = LAYERS.map((l) => l.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('every spec_path sits under its own spec_dir', () => {
    const wrong = LAYERS.filter(
      (l) => !l.spec_path.startsWith(`${table.specRoot}/${l.spec_dir}/`),
    ).map((l) => l.id);
    expect(wrong).toEqual([]);
  });

  it('a layer carries a package or a runtime package, never both', () => {
    const both = LAYERS.filter((l) => l.backing_package && l.backing_runtime_package).map((l) => l.id);
    // The two were one column until #1810, when rows naming a runtime package
    // where the reader expected a skill let the old check skip them.
    expect(both).toEqual([]);
  });

  it('providers name a flag the consumer actually declares', () => {
    // Writing a value into `providers` claims the consumer has a `--provider`
    // flag. Three skills do; the rest choose their variant some other way, and
    // the two lived in one column until review asked whether the values were
    // really flags. `contract` picks its runner through `kiwa-test --runner`,
    // and `orm-query`'s three ORMs are read out of the spec with no flag.
    const wrong: string[] = [];
    for (const l of LAYERS) {
      if (!l.providers.length) continue;
      const skill = read(`.claude/skills/${l.consumer_skill}/SKILL.md`);
      const declared = /`--provider \{([^}]+)\}`/.exec(skill);
      if (!declared) {
        wrong.push(`${l.id}: /${l.consumer_skill} declares no --provider`);
        continue;
      }
      const accepted = new Set(declared[1]!.split('|'));
      for (const p of l.providers) {
        if (!accepted.has(p)) wrong.push(`${l.id}: /${l.consumer_skill} does not accept "${p}"`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('a layer carries providers or variants, never both', () => {
    const both = LAYERS.filter((l) => l.providers.length && l.variants.length).map((l) => l.id);
    expect(both).toEqual([]);
  });

  it('a variant says how it is selected', () => {
    // A variant with no `selected_by` is a value nobody can act on.
    const unexplained = LAYERS.filter((l) => l.variants.length && !l.selected_by).map((l) => l.id);
    expect(unexplained).toEqual([]);
  });

  it('no layer declares a mode, because no consumer accepts one', () => {
    // `--mode` chose a framework helper for the two polyglot consumers. #1864
    // removed both, so a mode on any layer would render into an enum nothing
    // reads.
    const stray = LAYERS.filter((l) => l.mode).map((l) => l.id);
    expect(stray).toEqual([]);
  });

  it('holds exactly the layers the repository expects', () => {
    // A floor is a liveness check on the parser, not an inventory: dropping one
    // row and re-rendering satisfies it, and every generated artifact moves in
    // step so nothing else notices. Adding or removing a layer is a design act,
    // so it updates this list in the same commit and a reviewer sees it.
    expect([...LAYERS.map((l) => l.id)].sort()).toEqual(
      [
        'a11y',
        'api',
        'auth',
        'cache',
        'cli',
        'contract',
        'data',
        'e2e',
        'e2e-generic',
        'edge-handler',
        'integration',
        'job-queue',
        'nextjs-middleware',
        'nextjs-parallel-route',
        'nextjs-rsc',
        'nextjs-rsc-streaming',
        'nextjs-server-action',
        'orm-query',
        'ui',
        'unit',
      ].sort(),
    );
  });
});

describe('the target values and the Step conditions agree', () => {
  const TEST_SKILL = read('.claude/skills/kiwa-test/SKILL.md');

  /** The values `--target` accepts, from its own option line. */
  function declaredTargets(): string[] {
    const m = /`--target \{([^}]+)\}`/.exec(TEST_SKILL);
    expect(m, '--target option line not found').toBeTruthy();
    return m![1]!.split('|');
  }

  /** The values the Step headings actually admit, e.g. `(target=web or all)`. */
  function admittedTargets(): Set<string> {
    const out = new Set<string>();
    for (const line of TEST_SKILL.split('\n')) {
      if (!line.startsWith('### Step ')) continue;
      // The heading carries more than the condition — `(e2e-generic + a11y、
      // target=web or all)` puts text before it — so read from `target=` to the
      // first separator rather than to `)`. The comma terminators are for the
      // form that puts text after it (`(target=rust or all, Issue #581)`, whose
      // heading #1864 removed); the shape recurs, so they stay in the class.
      const m = /target=([^),、]+)/.exec(line);
      if (!m) continue;
      for (const value of m[1]!.split(/\s+or\s+/)) out.add(value.trim());
    }
    return out;
  }

  it('every accepted target starts at least one Step', () => {
    // `nextjs` was accepted and started nothing: the value existed, no Step
    // admitted it, and asking for it did nothing at all.
    const orphans = declaredTargets().filter((t) => !admittedTargets().has(t));
    expect(orphans).toEqual([]);
  });

  it('every target a Step admits is accepted', () => {
    const admitted = [...admittedTargets()];
    const declared = new Set(declaredTargets());
    expect(admitted.filter((t) => !declared.has(t))).toEqual([]);
  });

  it('no skill points anyone at a target that does not exist', () => {
    // Removing the value from the option line is not enough on its own: a skill
    // telling readers to run `--target nextjs` sends them at something that
    // stopped existing. `kiwa-nextjs` did exactly that.
    const declared = new Set(declaredTargets());
    const offenders: string[] = [];
    const files = readdirSync(resolve(REPO_ROOT, '.claude/skills')).map((name) => [
      name,
      resolve(REPO_ROOT, '.claude/skills', name, 'SKILL.md'),
    ]);
    // The README points readers at the same flag, and it is the copy someone
    // reads before ever opening a skill.
    files.push(['README.md', resolve(REPO_ROOT, 'README.md')]);
    for (const [name, file] of files) {
      if (!existsSync(file!)) continue;
      const body = readFileSync(file!, 'utf-8');

      // Only references aimed at `kiwa-test`. `--target` has been overloaded by
      // other skills to name the implementation file under test, so an
      // unqualified match reads those as target values.
      for (const m of body.matchAll(/kiwa-test[^`\n]*--target ([a-z]+)/g)) {
        if (!declared.has(m[1]!)) offenders.push(`${name}: --target ${m[1]}`);
      }

      // The other way readers meet the flag is the enum itself, which the
      // README repeats and `kiwa-test` declares. A stale value there points at
      // nothing just as loudly, and the bare-value pattern above skips it —
      // `--target {` is not `--target ` followed by a word.
      // The same list appears without the flag name — `$TARGET` holds one of
      // these — and a value left behind there is as stale as one in the enum.
      for (const m of body.matchAll(/\$TARGET[^\n]*?\(([^)]+)\)/g)) {
        const items = m[1]!.split('/').map((v) => v.trim());
        // A list of values, each written as inline code. Requiring the shape
        // keeps ordinary parentheses on a line that happens to mention
        // `$TARGET` from being read as candidates — shell snippets carry
        // `(dev)` and `(null)` for unrelated reasons.
        if (items.length < 2 || !items.every((v) => /^`[a-z-]+`$/.test(v))) continue;
        for (const value of items) {
          const clean = value.replace(/`/g, '');
          if (!declared.has(clean)) offenders.push(`${name}: $TARGET may hold ${clean}`);
        }
      }

      for (const m of body.matchAll(/--target \{([^}]+)\}/g)) {
        // An alternation, not a placeholder. `--target {path}` elsewhere names
        // the implementation file, and `--target {target}` in a report
        // template is a slot to fill — neither lists values.
        if (!m[1]!.includes('|')) continue;
        for (const value of m[1]!.split(/\\?\|/)) {
          const clean = value.replace(/[`\\ ]/g, '');
          if (clean && !declared.has(clean)) offenders.push(`${name}: enum lists ${clean}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('all covers exactly the layers the table gives it', () => {
    // The description says web. `docs/layers.json` is where that claim has to
    // hold, since the skills are generated from it.
    const byTarget = (t: string) =>
      LAYERS.filter((l) => (l.targets ?? []).includes(t)).map((l) => l.id);
    expect(byTarget('all').sort()).toEqual([...byTarget('web')].sort());
  });

  it('both covers exactly contract plus dapp', () => {
    const byTarget = (t: string) =>
      LAYERS.filter((l) => (l.targets ?? []).includes(t)).map((l) => l.id);
    expect(byTarget('both').sort()).toEqual(
      [...byTarget('contract'), ...byTarget('dapp')].sort(),
    );
  });
});

/** Escape a path so it can be matched literally inside a RegExp. */
function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The sentence shapes a producer uses to say "this is where I write".
 *
 * Matching the path alone is not enough. A producer can write the same token in
 * a sentence that says the opposite — "この path `x` は使わない" — or leave an old
 * one in a note, and a token match reads both as declarations. The point of
 * this check is to tell a declaration from a mention, so the line has to carry
 * one of the shapes producers actually declare in.
 */
const DECLARATION_FORMS = [
  /出力先[^\n]*への\s*Write\s*権限/, // `## 前提` の Write 権限行
  /--output[^\n]*(default|省略時)/, //   `## オプション` の default
  /を\s*Write\s*(して|する)/, //        冒頭の要約行
];

/**
 * Whether a skill declares this path as somewhere it writes.
 *
 * Two placements count. An inline-code token on a line that carries one of the
 * declaration shapes, or a table cell whose entire content is the path — the
 * `## 出力 path 早見` tables put nothing else in that cell, so the cell itself
 * is the declaration and no sentence shape applies.
 *
 * Both the path as `docs/layers.json` writes it and the form with the example
 * directory stripped are tried, because producers differ: a table can give the
 * full `examples/{example}/...` path while the prose forms give the tail. The
 * producers that took the first form were the Rust and Go tables, which #1864
 * removed; the two forms are still tried because the difference is the table's
 * against the prose's, not that language's.
 *
 * Limiting to a named section instead was tried and does not work: the shapes
 * sit under different headings (`## 前提`, `## オプション`, `## 出力 path 早見`)
 * and the headings are not consistent across producers.
 */
function declaresOutput(body: string, ...forms: string[]): boolean {
  for (const line of body.split('\n')) {
    for (const form of forms) {
      const escaped = escapeForRegExp(form);
      // The path has to be the whole token, not a piece of one.
      // `tests/{module}.test.ts` sits inside `tests/{module}.test.tsx`.
      const inlineCode = new RegExp('`\\s*' + escaped + '\\s*`');
      if (inlineCode.test(line) && DECLARATION_FORMS.some((shape) => shape.test(line))) return true;
      const wholeCell = new RegExp('\\|\\s*`?\\s*' + escaped + '\\s*`?\\s*\\|');
      if (wholeCell.test(line)) return true;
    }
  }
  return false;
}

/**
 * Which directory under `tests/fixtures/` each producer's output is moved to.
 *
 * This is a correspondence table, which is the thing these changes have been
 * removing rather than adding — but the objection was never to writing one
 * down. It was to writing it down in prose in a file nobody compares against
 * anything. Here both sides are checked against it in the same run: a producer
 * whose path stops matching fails, and a row this map does not cover fails too.
 *
 * The set-based check it replaces could not see a swap. Exchanging the Forge
 * and Hardhat paths leaves every path claimed exactly once, so counting alone
 * says nothing about whether the right producer claimed the right one.
 */
const FIXTURE_DIRS: Record<string, string> = {
  'kiwa-forge': 'contract-test',
  'kiwa-hardhat': 'hardhat-test',
  'kiwa-play': 'e2e-test',
};

/**
 * Split a markdown table row on its unescaped pipes.
 *
 * A `\\|` inside a cell is an escaped pipe rather than a separator — the
 * review-report row carries one — but "the character before is a backslash" is
 * not the same question. `\\\\|` is an escaped backslash followed by a real
 * separator, and a lookbehind one character wide reads it as escaped, merging
 * two cells into one and letting a malformed row pass the shape check.
 *
 * What decides it is whether the run of backslashes ending at the pipe is odd.
 */
function splitRow(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  for (let i = 0; i < row.length; i += 1) {
    const ch = row[i]!;
    if (ch === '\\') {
      // Consume the whole run, so its length decides what follows it.
      let run = 0;
      while (row[i] === '\\') {
        run += 1;
        i += 1;
      }
      // Each pair of backslashes is one literal backslash. An odd run leaves
      // one over, and that one escapes whatever follows.
      if (row[i] === '|' && run % 2 === 1) {
        current += '\\'.repeat((run - 1) / 2) + '|';
        continue; // the pipe was consumed by the escape
      }
      current += '\\'.repeat(Math.floor(run / 2)) + (run % 2 === 1 ? '\\' : '');
      i -= 1; // hand the next character back to the loop
      continue;
    }
    if (ch === '|') {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

/**
 * The data rows of the table under a heading, as cell arrays.
 *
 * Nothing is dropped. Discarding a row that does not fit means the check passes
 * when the table breaks, which is the opposite of what a check on the table is
 * for — so a row whose shape does not match the header is an error here rather
 * than a row that quietly disappears.
 */
function tableRows(body: string, heading: string): string[][] {
  const start = body.indexOf(heading);
  expect(start, `${heading} が見つからない`).toBeGreaterThan(-1);
  const rest = body.slice(start + heading.length);
  const end = rest.search(/^## /m);
  const section = end === -1 ? rest : rest.slice(0, end);

  const lines = section.split('\n').filter((line) => line.trimStart().startsWith('|'));
  const cells = lines.map((line) => splitRow(line.trim().replace(/^\||\|$/g, '')));
  expect(cells.length, `${heading} に表が無い`).toBeGreaterThan(2);

  const [header, separator, ...rows] = cells as [string[], string[], ...string[][]];
  expect(separator.every((c) => /^-+$/.test(c)), `${heading} の 2 行目が区切りでない`).toBe(true);

  const malformed = rows
    .map((row, i) => ({ row, i }))
    .filter(({ row }) => row.length !== header.length)
    .map(({ row, i }) => `row ${i + 1}: ${row.length} cells, header has ${header.length}`);
  expect(malformed, `${heading} の行が header と cell 数で食い違う`).toEqual([]);

  return rows;
}

describe('a table row splits on its unescaped pipes', () => {
  it('keeps an escaped pipe inside its cell', () => {
    expect(splitRow('a | b \\| c | d')).toEqual(['a', 'b | c', 'd']);
  });

  it('treats a pipe after an escaped backslash as a separator', () => {
    // The case a one-character lookbehind gets wrong: the backslash is itself
    // escaped, so the pipe that follows is a real separator.
    expect(splitRow('a | b \\\\| c')).toEqual(['a', 'b \\', 'c']);
  });

  it('keeps a trailing backslash run at the end of the row', () => {
    // The run ends the string, so there is no next character to escape.
    expect(splitRow('a | b \\\\')).toEqual(['a', 'b \\']);
  });

  it('leaves a backslash that escapes something other than a pipe', () => {
    expect(splitRow('a \\x | b')).toEqual(['a \\x', 'b']);
  });

  it('keeps empty cells', () => {
    expect(splitRow('a || b')).toEqual(['a', '', 'b']);
  });

  it('handles a cell that is only a backslash', () => {
    expect(splitRow('a | \\\\ | b')).toEqual(['a', '\\', 'b']);
  });

  it('reads a run of three backslashes as escaping the pipe', () => {
    expect(splitRow('a \\\\\\| b')).toEqual(['a \\| b']);
  });
});

describe('each producer claims its own fixture row', () => {
  const mover = read('.claude/skills/kiwa-test/SKILL.md');

  const rows = tableRows(mover, '## 2. 生成 file 一覧');

  /** Every row of the Step 5.5 table whose path is a fixture destination. */
  const fixtureRows = rows
    .map((cells) => {
      const path = cells[1];
      // Asserted before the filter. Filtering first turns an empty cell into a
      // row that simply is not a fixture row, which is indistinguishable from a
      // row that never was one.
      expect(path, `path cell が空の行がある: ${cells.join(' | ')}`).toBeTruthy();
      return path!;
    })
    .filter((path) => path.startsWith('tests/fixtures/'));

  it('parses the table rather than pattern-matching the file', () => {
    // Reading the whole file for a shape meant a row written differently was
    // invisible: the count stayed at 3 and the check passed while the table had
    // grown. Parsing the table means an unparseable row is a row with the wrong
    // number of cells, not a row that quietly vanishes.
    expect(fixtureRows.length).toBeGreaterThan(0);
    for (const path of fixtureRows) {
      expect(path, 'fixture 行の path cell が空').not.toBe('');
    }
  });

  it('every producer writes into the directory the table gives it', () => {
    // A swap between two producers keeps each path claimed once, so the pairing
    // has to be checked directly.
    const wrong: string[] = [];
    for (const layer of LAYERS) {
      for (const [skill, outputs] of Object.entries(layer.test_outputs ?? {})) {
        for (const output of outputs as string[]) {
          if (!output.startsWith('tests/fixtures/')) continue;
          const expected = FIXTURE_DIRS[skill];
          expect(expected, `${skill} の退避先が FIXTURE_DIRS に無い`).toBeTruthy();
          if (!output.includes(`/${expected}/`)) wrong.push(`${layer.id} -> ${skill}: ${output}`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('the table and the map describe the same destinations, one each', () => {
    // Keeps the map from going stale in either direction: a row added to the
    // table without an entry here fails, and an entry here with no row fails.
    //
    // Compared as lists rather than sets. Collapsing duplicates first hides
    // exactly the edits worth catching — a second row for a destination that
    // already has one, or a map entry nothing uses.
    // tests / fixtures / {example} / <dir> — the destination is the fourth part.
    const fromTable = fixtureRows.map((p) => p.split('/')[3]).sort();
    const fromMap = Object.values(FIXTURE_DIRS).sort();
    expect(fromTable).toEqual(fromMap);
  });
});

describe('a mention is not a declaration', () => {
  it('does not accept a path that only appears in prose', () => {
    // The check has to separate "this is where I write" from "this path exists
    // in a sentence". A whole-token match anywhere in the body cannot.
    expect(declaresOutput('この path (tests/nowhere/{m}.ts) は読まない。', 'tests/nowhere/{m}.ts')).toBe(
      false,
    );
  });

  it('accepts the shapes producers actually use', () => {
    expect(declaresOutput('- 出力先 `tests/e2e/{module}.spec.ts` への Write 権限', 'tests/e2e/{module}.spec.ts')).toBe(true);
    expect(declaresOutput('| Foundry test | tests/fixtures/x/{C}.t.sol | Layer 2 |', 'tests/fixtures/x/{C}.t.sol')).toBe(true);
    expect(declaresOutput('- `--output {path}` — 出力先 (default `tests/{m}.auth.test.ts`)', 'tests/{m}.auth.test.ts')).toBe(true);
  });

  it('rejects a negated sentence that puts the path in inline code', () => {
    // The token is there and correct. The sentence says the opposite, and a
    // token match cannot tell the two apart — which is the whole point of the
    // check this test guards.
    expect(declaresOutput('この path `tests/x/{m}.ts` は使わない。', 'tests/x/{m}.ts')).toBe(false);
  });

  it('rejects a cell that carries the path plus something else', () => {
    // Otherwise a producer could satisfy the cell rule by putting backticks
    // around the path and a note beside it, sidestepping the sentence shapes.
    expect(declaresOutput('| out | `tests/x/{m}.ts` (退避済) |', 'tests/x/{m}.ts')).toBe(false);
  });

  it('does not accept a longer path that merely starts the same way', () => {
    expect(declaresOutput('- 出力先 `tests/{module}.test.tsx`', 'tests/{module}.test.ts')).toBe(false);
  });
});

describe('every declared output path is one its producer writes', () => {
  it('each test_outputs entry appears in the producing skill', () => {
    // The rows were written from the old resolver rather than from the
    // producers, and 15 of 31 named a path no skill declares. A review that
    // looks where nothing is written finds nothing and says so.
    // `kiwa-test` Step 5.5 moves generated tests out of the example directory,
    // so the second path of a row is declared there rather than by the producer.
    const mover = read('.claude/skills/kiwa-test/SKILL.md');

    const missing: string[] = [];
    for (const layer of LAYERS) {
      for (const [skill, outputs] of Object.entries(layer.test_outputs ?? {})) {
        const body = read(`.claude/skills/${skill}/SKILL.md`);
        // Every path, not just one of them. Checking the array with `some`
        // let 9 of 23 single-slot reverts survive, and the fixture paths passed
        // on the strength of a sibling that had nothing to do with them.
        for (const output of outputs as string[]) {
          // The producer states its own path; the table prefixes the example
          // directory because `kiwa-test` runs the skill from inside one.
          const bare = output.replace(/^(examples\/)?\{example\}\//, '');
          const where = output.startsWith('tests/fixtures/') ? mover : body;
          if (!declaresOutput(where, bare, output)) missing.push(`${layer.id} -> ${skill}: ${output}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('the skills carry what the table renders', () => {
  it('the generated regions are up to date', () => {
    // The renderer is the assertion. `--check` re-renders from the table and
    // compares, so a hand edit inside a region fails here rather than surviving
    // as a second source of truth.
    expect(() =>
      execFileSync('node', ['scripts/rebuild-layer-routing.mjs', '--check'], {
        cwd: REPO_ROOT,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });

  it('the generated signals are up to date', () => {
    // Same shape, other direction: `docs/stack-signals.json` holds a half
    // derived from six packages' peerDependencies. Adding a peer without
    // regenerating would leave the library undetectable with nothing saying so.
    expect(() =>
      execFileSync('node', ['scripts/rebuild-stack-signals.mjs', '--check'], {
        cwd: REPO_ROOT,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });

  it('no skill calls a skill that does not exist', () => {
    // The table covers routing; free prose can still name a skill. #1804 left
    // `/kiwa-visual` in a flow block and a Mermaid node, in two notations the
    // earlier matcher did not reach.
    //
    // A call starts its token: what precedes it is never a path character.
    // Excluding `[A-Za-z0-9_./-]` admits quotes, brackets and table pipes,
    // which is what Mermaid nodes and Markdown links use, while rejecting
    // `../kiwa-gh-pages` and `scripts/kiwa-taxonomy-run.mjs`.
    const dirs = skillDirs();
    const dangling: string[] = [];
    for (const name of dirs) {
      const rel = `.claude/skills/${name}/SKILL.md`;
      if (!existsSync(resolve(REPO_ROOT, rel))) continue;
      for (const m of read(rel).matchAll(/(^|[^A-Za-z0-9_./-])\/(kiwa-[a-z0-9-]+)/gm)) {
        if (!dirs.has(m[2]!)) dangling.push(`${rel} -> /${m[2]!}`);
      }
    }
    expect([...new Set(dangling)]).toEqual([]);
  });

  it('the enum reaches every layer in the table', () => {
    // Rendering could drop a row silently if the template ever filtered. Read
    // the rendered enum back and compare it to the table.
    const rendered = /`--layer \{([^}]+)\}`/.exec(read('.claude/skills/kiwa-design/SKILL.md'));
    expect(rendered, 'kiwa-design has no --layer enum').not.toBeNull();
    const values = rendered![1]!.split('|').filter((v) => v !== 'all');
    expect([...values].sort()).toEqual([...LAYERS.map((l) => l.id)].sort());
  });

  it('no skill declares a --layer enum outside a generated region', () => {
    // Without this the whole scheme has a hole: `--check` only compares what is
    // inside the markers, and the assertion above reads the first match, so a
    // second enum written anywhere else passes both. Verified by writing
    // `--layer {contract|bogus-layer}` into a neighbouring section — the suite
    // stayed green.
    //
    // One declaration per skill, and it has to be the generated one.
    const stray: string[] = [];
    for (const [rel, region] of [
      ['.claude/skills/kiwa-design/SKILL.md', 'design-enum'],
      ['.claude/skills/kiwa-review/SKILL.md', 'review-enum'],
    ] as const) {
      const source = read(rel);
      const declarations = [...source.matchAll(/`--layer \{/g)];
      if (declarations.length !== 1) {
        stray.push(`${rel}: ${declarations.length} declarations, expected 1`);
        continue;
      }
      const from = source.indexOf(`<!-- kiwa-layers:${region}:start -->`);
      const to = source.indexOf(`<!-- kiwa-layers:${region}:end -->`);
      const at = declarations[0]!.index!;
      if (!(from < at && at < to)) stray.push(`${rel}: declaration sits outside the region`);

      // `--layer foo` in running prose names a specific layer without the brace
      // form, so counting declarations misses it. Any layer named outside the
      // region has to be one the table knows.
      //
      // `all` is not a layer. It is the reserved value meaning "every layer",
      // which is why the renderer appends it to the enum rather than reading it
      // from the table.
      const known = new Set([...LAYERS.map((l) => l.id), 'all']);
      for (const m of source.matchAll(/--layer\s+([a-z][a-z0-9-]*)/g)) {
        const idx = m.index!;
        if (from < idx && idx < to) continue;
        if (!known.has(m[1]!)) stray.push(`${rel}: names unknown layer "${m[1]}" outside the region`);
      }
    }
    expect(stray).toEqual([]);
  });

  it('every test_outputs key is a declared consumer', () => {
    // `contract` is written by two skills in two shapes. A single value dropped
    // the Hardhat review path silently, so the column is keyed by consumer and
    // the keys have to be consumers the layer actually names.
    const wrong: string[] = [];
    for (const l of LAYERS) {
      const known = new Set([l.consumer_skill, ...l.also_consumed_by]);
      for (const skill of Object.keys(l.test_outputs)) {
        if (!known.has(skill)) wrong.push(`${l.id}: "${skill}" is not a consumer`);
      }
      if (!l.test_outputs[l.consumer_skill]?.length) wrong.push(`${l.id}: primary consumer has no output`);
    }
    expect(wrong).toEqual([]);
  });

  it('the routing table appears only inside its region', () => {
    // Same hole, other shape: a second routing table elsewhere in the file
    // would read as authoritative to anyone following the skill.
    const source = read('.claude/skills/kiwa-design/SKILL.md');
    const from = source.indexOf('<!-- kiwa-layers:routing-table:start -->');
    const to = source.indexOf('<!-- kiwa-layers:routing-table:end -->');
    const outside: string[] = [];
    for (const m of source.matchAll(/^\| `[a-z0-9-]+` \| `tests\/spec\//gm)) {
      const at = m.index!;
      if (!(from < at && at < to)) outside.push(m[0]!.slice(0, 40));
    }
    expect(outside).toEqual([]);
  });
});

/**
 * test-review が test file をどこから知るか (#1902)。
 *
 * `kiwa-review` は `docs/layers.json` から生成した 21 行の表を持ち、 test-review
 * mode の既定でそこから対応 file を選んでいた。 表は生成物なので宣言は drift しない
 * 一方、 **表が持つのは宣言だけ** で、 2 形のどちらを採るか / placeholder をどう埋めるか /
 * 起点の外を指す値をどう扱うか / symlink を辿るかは読み手に残っていた。 その判断が
 * skill の散文にしかなかった間に 2 つの欠陥が 8 round の review を通り抜けている
 * (#1896)。 解決は #1899 で `kiwa layers --producer --project-root` に寄せた。
 */
describe('test-review の test path が CLI 経路に閉じている', () => {
  /**
   * `/kiwa-review --mode test-review` を **起動する** 行。
   *
   * 責務境界の節や本文の言及と分ける必要がある (`- 下流 ... /kiwa-review --mode
   * test-review --layer auth` は起動ではない)。 実起動は必ず `--module` を渡すので、
   * それを持つ行だけを取る。 code block だけに絞る形は使えない = 実際の起動指示の
   * 多くが本文の backtick 内にある。
   */
  /** 1 本の markdown から起動 command を取り出す (fixture でも回せる pure helper)。 */
  function extractInvocations(body: string): string[] {
    return body
      .split('\n')
      .map((line) => /\/kiwa-review[^`]*/.exec(line)?.[0] ?? '')
      .filter((command) => command.includes('--module'))
      .map((command) => command.trim());
  }

  /**
   * `--mode` の値。 空白区切りと `=` 区切りを 1 箇所で吸収する。
   *
   * 分類と必須検査が別々の literal を持つと、 表記を変えただけで「mode 無し」 と
   * 「test-review でない」 の両方に化ける (Round 2 F3)。
   */
  function modeOf(command: string): string | null {
    return /--mode[ =]([a-z-]+)/.exec(command)?.[1] ?? null;
  }

  function invocations(): { skill: string; command: string }[] {
    return [...skillDirs()]
      .filter((name) => name !== 'kiwa-review')
      .flatMap((name) => {
        const rel = `.claude/skills/${name}/SKILL.md`;
        if (!existsSync(resolve(REPO_ROOT, rel))) return [];
        return extractInvocations(read(rel)).map((command) => ({ skill: name, command }));
      });
  }

  /** The subset that asks for a test review. */
  function testReviews(): { skill: string; command: string }[] {
    return invocations().filter(({ command }) => modeOf(command) === 'test-review');
  }

  it('抽出が起動と言及を見分ける', () => {
    // 抽出が空集合へ壊れると、 下の検査はすべて何も見ずに緑になる。 repo の別概念
    // (`--no-review` の宣言等) を生存確認に使うと、 その概念の設計変更で偽陽性に
    // なる (Round 2 F5)。 helper 自体に fixture を当てる。
    const fixture = [
      '`--no-review` 未指定なら `/kiwa-review --mode test-review --layer auth --module {m} --producer kiwa-auth --project-root .` を呼ぶ。',
      '- 下流 ... `/kiwa-review --mode test-review --layer auth` (test 品質 review)',
      '本文で `/kiwa-review --mode test-review` に触れるだけの行。',
      '```text',
      '/kiwa-review --mode=result-review --module {example} --lang $DOC_LANG',
      '```',
    ].join('\n');
    const found = extractInvocations(fixture);
    expect(found, '起動行だけを取れていない').toEqual([
      '/kiwa-review --mode test-review --layer auth --module {m} --producer kiwa-auth --project-root .',
      '/kiwa-review --mode=result-review --module {example} --lang $DOC_LANG',
    ]);
    expect(modeOf(found[0]!), '空白区切りの mode').toBe('test-review');
    expect(modeOf(found[1]!), '= 区切りの mode').toBe('result-review');
    expect(invocations().length, '実 skill から 1 件も抽出できない').toBeGreaterThan(0);
  });

  it('起動行が mode を名乗る', () => {
    // `--mode` は kiwa-review の必須引数。 省いた起動は mode 未指定で止まるうえ、
    // test-review 用の検査からも外れる = 契約を書き換えても気付けない。 実測で
    // `kiwa-e2e` と `kiwa-a11y` の 2 件が `--mode` を持たないまま残っていた
    // (PR #1904 Round 1 F1)。
    const modes = new Set(['spec-review', 'test-review', 'result-review']);
    const missing = invocations()
      .filter(({ command }) => !modes.has(modeOf(command) ?? ''))
      .map(({ skill, command }) => `${skill}: ${command.slice(0, 120)}`);
    expect(missing, `--mode を渡していない起動行:\n${missing.join('\n')}`).toEqual([]);
  });

  it('起動行が --test-path か (--producer と --project-root) のどちらかを渡す', () => {
    // `--test-path` は明示 override で、 渡した path はそのまま Read される。
    // 省略した時の既定が CLI なので、 省略するなら CLI が要求する 2 値を渡す。
    // どちらも無い起動は、 review 側が自分で解決するしかない状態を作る。
    //
    // 判定は **起動 command の部分だけ** を見る。 行全体で見ると、 同じ行に置いた
    // 説明文 (「`--producer` と `--project-root` は ... のために要る」) が flag 名を
    // 含むため、 command から外しても緑のままになる (変異試験で実測)。
    const missing = testReviews()
      .filter(({ command }) => !command.includes('--test-path'))
      .filter(({ command }) => !(command.includes('--producer') && command.includes('--project-root')))
      .map(({ skill, command }) => `${skill}: ${command.slice(0, 120)}`);
    expect(missing, `--producer / --project-root を渡していない起動行:\n${missing.join('\n')}`).toEqual(
      [],
    );
  });

  it('--test-path に pattern を渡さない', () => {
    // pattern は宣言であって、 生成した file の名前ではない。 skill に写すと
    // `docs/layers.json` と 2 箇所になり、 2 形のうち片方しか見ない形に戻る
    // (`--test-path test/*.t.sol` は退避後は 0 件になる)。 明示 override は
    // 「いま書いた file」 を渡す時のためにある。
    const copied = testReviews()
      .map(({ skill, command }) => {
        const value = /--test-path\s+(\S+)/.exec(command)?.[1];
        return value && /[*{]/.test(value) ? `${skill}: --test-path ${value}` : null;
      })
      .filter((entry): entry is string => entry !== null);
    expect(copied, `宣言を写した --test-path:\n${copied.join('\n')}`).toEqual([]);
  });

  it('kiwa-review が 2 値を宣言し、 既定が test_paths を名指しする', () => {
    const lines = read('.claude/skills/kiwa-review/SKILL.md').split('\n');
    for (const flag of ['--producer', '--project-root']) {
      const declared = lines.filter((l) => l.startsWith(`- \`${flag} `));
      expect(declared.length, `kiwa-review が ${flag} を宣言していない`).toBe(1);
    }
    const testPath = lines.find((l) => l.startsWith('- `--test-path '));
    expect(testPath, '--test-path の宣言が無い').toBeDefined();
    expect(testPath, '--test-path の既定が test_paths を名指ししていない').toContain('test_paths');
  });

  it('kiwa-review が test 出力先を列挙しない', () => {
    // 表を消しても、 `## 前提` のような別の節に「対応 test file は
    // `examples/{X}/test/` または `tests/fixtures/{X}/...` に存在」 と書いてあれば
    // 同じ知識が残る。 実測でその 1 行が残っており、 表の検査は通っていた
    // (PR #1904 Round 1 F2)。
    //
    // 出力先の layout を名指しする token を禁じる。 `{example}/...` は
    // `--project-root` の宣言で起点の形として出るため、 dir を続けた形だけを見る。
    // 禁止する形は **表から導く**。 綴りを 2 つ書き並べる形だと、 同じ layout を
    // 別表記で書くだけで戻せる (`tests/fixtures` の末尾 slash 無し /
    // `examples/{X}/test/` の placeholder 違い、 Round 2 F4 で実測)。
    //
    // 表の各宣言から「placeholder の次の segment」 を集めると、 test が置かれる
    // dir 名 (`test` / `tests` / `contract-test` / `hardhat-test` / `e2e-test`) が
    // そのまま出る。 層が増えれば禁止対象も自動で増える。
    const testDirs = new Set(
      LAYERS.flatMap((l) => Object.values(l.test_outputs ?? {}).flat())
        .map((path) => path.replace(/^tests\/fixtures\//, '').split('/')[1])
        .filter((segment): segment is string => !!segment && !/[{*]/.test(segment)),
    );
    expect(testDirs.size, '表から test dir を導けない').toBeGreaterThan(0);
    const dirAlternation = [...testDirs].map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const patterns = [
      // 退避先。 末尾 slash の有無と前後の境界を問わない。
      /(?:^|[^a-z0-9_/])tests\/fixtures(?![a-z0-9_-])/i,
      // kiwa 自身の example dir を起点に書く形 (placeholder 名は問わない)。
      /(?:^|[^a-z0-9_/])examples\/\{[A-Za-z_]+\}\//,
      // placeholder の直後に test dir が続く形。 `{example}/...` の起点宣言は
      // dir が続かないため当たらない。
      new RegExp(`\\{[A-Za-z_]+\\}/(?:${dirAlternation})(?![a-z0-9_-])`),
    ];
    const source = read('.claude/skills/kiwa-review/SKILL.md');
    const naming = source
      .split('\n')
      .filter((line) => patterns.some((pattern) => pattern.test(line)))
      .map((line) => line.trim().slice(0, 120));
    expect(naming, `test 出力先を名指ししている行:\n${naming.join('\n')}`).toEqual([]);
  });

  it('kiwa-review が test 出力先の対応表を持たない', () => {
    // 生成領域ごと消した。 表が「対応 test file」 を並べている限り、 注意書きを
    // 添えても実行の指示として読まれる (PR #1900 Round 1 F3 で実測)。
    const source = read('.claude/skills/kiwa-review/SKILL.md');
    expect(source, 'resolver 領域が残っている').not.toContain('kiwa-layers:resolver');
    const rows = [...source.matchAll(/^\| `[a-z0-9-]+` \| `\/kiwa-[a-z0-9-]+` \|/gm)].map((m) => m[0]!);
    expect(rows, `layer × 書き手 の表が残っている:\n${rows.join('\n')}`).toEqual([]);
  });
});
