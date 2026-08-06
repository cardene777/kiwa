import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

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
  mode?: string;
  test_output: string;
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

  it('a mode belongs only to a layer whose consumer accepts one', () => {
    // `--mode` is a `kiwa-rust` / `kiwa-go` flag. A mode on any other layer
    // would render into an enum nothing reads.
    const stray = LAYERS.filter((l) => l.mode && !['kiwa-rust', 'kiwa-go'].includes(l.consumer_skill)).map(
      (l) => l.id,
    );
    expect(stray).toEqual([]);
  });

  it('covers a non-trivial number of layers', () => {
    // A table that parsed to nothing would satisfy every assertion above.
    expect(LAYERS.length).toBeGreaterThanOrEqual(30);
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
    }
    expect(stray).toEqual([]);
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
