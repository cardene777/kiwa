import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Walk up to the repository root rather than counting directories.
 *
 * This file runs from two places — `tests/` when read as source and
 * `.vitest-dist/tests/` when compiled — which are one level apart. A fixed
 * depth is right for one of them and silently reads the wrong tree in the
 * other.
 */
function repoRoot(): string {
  let dir = HERE;
  for (let up = 0; up < 8; up += 1) {
    if (existsSync(resolve(dir, 'docs', 'layers.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('docs/layers.json not found above this test');
}

const REPO_ROOT = repoRoot();

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
    // The two were one column until #1810. Ten `rust-*` / `go-*` rows named
    // `kiwa-test-rs` / `kiwa-test-go` where the reader expected a skill, which
    // is what let the old check skip them.
    expect(both).toEqual([]);
  });

  it('every polyglot layer names the runtime package that serves it', () => {
    const missing = LAYERS.filter(
      (l) => (l.runtime === 'rust' || l.runtime === 'go') && !l.backing_runtime_package,
    ).map((l) => l.id);
    expect(missing).toEqual([]);
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

  it('a mode belongs only to a layer whose consumer accepts one', () => {
    // `--mode` is a `kiwa-rust` / `kiwa-go` flag. A mode on any other layer
    // would render into an enum nothing reads.
    const stray = LAYERS.filter((l) => l.mode && !['kiwa-rust', 'kiwa-go'].includes(l.consumer_skill)).map(
      (l) => l.id,
    );
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
        'go-echo',
        'go-fiber',
        'go-gin',
        'go-integration',
        'go-unit',
        'integration',
        'job-queue',
        'nextjs-middleware',
        'nextjs-parallel-route',
        'nextjs-rsc',
        'nextjs-rsc-streaming',
        'nextjs-server-action',
        'orm-query',
        'rust-actix-web',
        'rust-axum',
        'rust-integration',
        'rust-tower-http',
        'rust-unit',
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
      // The heading carries more than the condition — `(e2e-generic + a11y,
      // target=web or all)` and `(target=rust or all, Issue #581)` both occur —
      // so read from `target=` to the first separator rather than to `)`.
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

      // Only references aimed at `kiwa-test`. `--target` is overloaded — in
      // `kiwa-rust` and `kiwa-go` it names the implementation file under test —
      // so an unqualified match reads those as target values.
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
        // An alternation, not a placeholder. `--target {path}` in `kiwa-rust`
        // names the implementation file, and `--target {target}` in a report
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
    // The description says web + rust + go. `docs/layers.json` is where that
    // claim has to hold, since the skills are generated from it.
    const byTarget = (t: string) =>
      LAYERS.filter((l) => (l.targets ?? []).includes(t)).map((l) => l.id);
    expect(byTarget('all').sort()).toEqual(
      [...byTarget('web'), ...byTarget('rust'), ...byTarget('go')].sort(),
    );
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
 * Whether a skill declares this path as somewhere it writes.
 *
 * A whole-token match anywhere in the body was still too loose: a producer
 * saying "this path is *not* used" or leaving an old one in a note would count.
 * The declarations are written in two shapes and nothing else uses either.
 *
 * | shape | example |
 * |---|---|
 * | inline code | ``- 出力先 `tests/e2e/{module}.spec.ts` への Write 権限`` |
 * | a whole table cell | `| Foundry test (退避済) | tests/fixtures/.../{Contract}.t.sol |` |
 *
 * Limiting to a named section instead was tried and does not work: the three
 * declaration forms sit under different headings (`## 前提`, `## オプション`,
 * `## 出力 path 早見`) and the headings are not consistent across producers.
 */
function declaresOutput(body: string, path: string): boolean {
  const escaped = escapeForRegExp(path);
  // The path has to be the whole token, not a piece of one. `tests/{module}.test.ts`
  // sits inside `tests/{module}.test.tsx`, so allowing anything around it lets a
  // row claim a path whose producer writes a different file.
  const inlineCode = new RegExp('`\\s*' + escaped + '\\s*`');
  const wholeCell = new RegExp('\\|\\s*' + escaped + '\\s*\\|');
  return inlineCode.test(body) || wholeCell.test(body);
}

describe('a mention is not a declaration', () => {
  it('does not accept a path that only appears in prose', () => {
    // The check has to separate "this is where I write" from "this path exists
    // in a sentence". A whole-token match anywhere in the body cannot.
    expect(declaresOutput('この path (tests/nowhere/{m}.ts) は読まない。', 'tests/nowhere/{m}.ts')).toBe(
      false,
    );
  });

  it('accepts the two shapes producers actually use', () => {
    expect(declaresOutput('- 出力先 `tests/e2e/{module}.spec.ts` への Write 権限', 'tests/e2e/{module}.spec.ts')).toBe(true);
    expect(declaresOutput('| Foundry test | tests/fixtures/x/{C}.t.sol | Layer 2 |', 'tests/fixtures/x/{C}.t.sol')).toBe(true);
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
          if (!declaresOutput(where, bare)) missing.push(`${layer.id} -> ${skill}: ${output}`);
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
      ['.claude/skills/kiwa-rust/SKILL.md', 'rust-enum'],
      ['.claude/skills/kiwa-go/SKILL.md', 'go-enum'],
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
