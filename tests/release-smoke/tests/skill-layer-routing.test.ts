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
 * The `--layer` contract, checked across the three places that state it.
 *
 * `/kiwa-design` declares the enum and a routing table that names the Layer 2
 * skill for each value; `/kiwa-review` declares its own copy of the enum. The
 * three are prose in three separate `SKILL.md` files, so deleting a package
 * removes none of them.
 *
 * #1804 deleted `@kiwa-lab/visual` and `@kiwa-lab/solidstart` and their skills.
 * The routing survived: three enum values kept pointing at `/kiwa-visual` and
 * `/kiwa-solidstart`, and `/kiwa-test --target web` kept calling the first of
 * those. Nothing failed, because nothing compared the prose to the filesystem.
 *
 * These assertions are the comparison. They are a stopgap: the real fix is a
 * machine-readable mapping that all three read from, and when that lands this
 * file should assert against it instead of parsing prose.
 */

const DESIGN = '.claude/skills/kiwa-design/SKILL.md';
const REVIEW = '.claude/skills/kiwa-review/SKILL.md';
const TEST = '.claude/skills/kiwa-test/SKILL.md';

/** The `{a|b|c}` body of the `--layer` option line. */
function layerEnum(rel: string): string[] {
  const m = /`--layer \{([^}]+)\}`/.exec(read(rel));
  if (!m) throw new Error(`${rel}: no --layer enum found`);
  return m[1]!.split('|').filter((v) => v !== 'all');
}

/**
 * The routing table rows, as `layer -> [skill, ...]`.
 *
 * A row is `| \`layer\` | \`path\` | description |`, and the description names
 * the consuming skill as `/kiwa-*`. Some rows name a non-skill consumer
 * (`kiwa-test-rs`, `kiwa-test-go`) which is a cargo/go package rather than a
 * skill directory, so only `/`-prefixed names are treated as skills.
 */
function routingTable(rel: string): Map<string, string[]> {
  const rows = new Map<string, string[]>();
  for (const line of read(rel).split('\n')) {
    const m = /^\| `([a-z0-9-]+)` \| `[^`]*` \| (.+)$/.exec(line);
    if (!m) continue;
    const skills = [...m[2]!.matchAll(/`\/([a-z-]+)`/g)].map((s) => s[1]!);
    rows.set(m[1]!, skills);
  }
  return rows;
}

function skillDirs(): Set<string> {
  return new Set(
    readdirSync(resolve(REPO_ROOT, '.claude/skills'), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name),
  );
}

/** Every `SKILL.md`, relative to the repository root. */
function skillFiles(): string[] {
  return [...skillDirs()]
    .map((name) => `.claude/skills/${name}/SKILL.md`)
    .filter((rel) => existsSync(resolve(REPO_ROOT, rel)));
}

describe('--layer routing agrees with the filesystem', () => {
  it('every routing row names a skill that exists', () => {
    const dirs = skillDirs();
    const dangling: string[] = [];
    for (const [layer, skills] of routingTable(DESIGN)) {
      for (const skill of skills) {
        if (!dirs.has(skill)) dangling.push(`${layer} -> /${skill}`);
      }
    }
    // This is the assertion #1804 needed and did not have: `visual`,
    // `solidstart-server-function` and `solidstart-api-route` all pointed at
    // skills that had just been deleted.
    expect(dangling).toEqual([]);
  });

  it('every enum value has a routing row', () => {
    const rows = routingTable(DESIGN);
    const missing = layerEnum(DESIGN).filter((v) => !rows.has(v));
    expect(missing).toEqual([]);
  });

  it('the design enum and the review enum hold the same values', () => {
    // `/kiwa-review` claims its three modes cover every layer, so a value the
    // design skill accepts and the review skill does not is a spec that cannot
    // be reviewed. `orm-query` and `nextjs-rsc-streaming` were in that state.
    const design = layerEnum(DESIGN);
    const review = layerEnum(REVIEW);
    expect([...design].sort()).toEqual([...review].sort());
  });

  it('no skill calls a skill that does not exist', () => {
    // Every `SKILL.md`, not the three this PR touched. 24 of them name a
    // `/kiwa-*` skill, and a stale call in any of them breaks the same way.
    //
    // Both notations count. The flow blocks write bare calls
    // (`[Step 3a] /kiwa-design --layer contract`) while prose uses backticks,
    // and `/kiwa-test` carried its stale `/kiwa-visual` calls in both forms.
    // A slash followed by a name is not enough to mean "skill call". The same
    // shape appears in a worktree path (`../kiwa-gh-pages`), a cargo/go package
    // (`kiwa-test-rs`), and a script path (`scripts/kiwa-taxonomy-run.mjs`).
    // A call starts the token: preceded by whitespace, a backtick, or a line
    // start, never by a path segment.
    const dirs = skillDirs();
    const dangling: string[] = [];
    for (const rel of skillFiles()) {
      for (const m of read(rel).matchAll(/(^|[\s`(])\/(kiwa-[a-z0-9-]+)/gm)) {
        if (!dirs.has(m[2]!)) dangling.push(`${rel} -> /${m[2]!}`);
      }
    }
    expect([...new Set(dangling)]).toEqual([]);
  });

  it('a routing row is not silently overwritten by a duplicate', () => {
    // `routingTable` keys by layer, so two rows for one layer would collapse
    // and the second would never be checked.
    const seen: string[] = [];
    for (const line of read(DESIGN).split('\n')) {
      const m = /^\| `([a-z0-9-]+)` \| `[^`]*` \|/.exec(line);
      if (m) seen.push(m[1]!);
    }
    expect(seen.length).toBe(new Set(seen).size);
  });

  it('the scan covers a non-trivial number of layers and skills', () => {
    // Without this, a parser that silently matches nothing would make every
    // assertion above pass on an empty set.
    //
    // The floors sit just under the real counts. Raising them to the exact
    // number would fail on every legitimate addition; leaving them at zero
    // would let a broken parser through. They are a liveness check on the
    // parser, not an inventory.
    expect(layerEnum(DESIGN).length).toBeGreaterThanOrEqual(30);
    expect(routingTable(DESIGN).size).toBeGreaterThanOrEqual(30);
    expect(skillFiles().length).toBeGreaterThanOrEqual(20);
  });

  it('the three skill files are where this expects them', () => {
    for (const rel of [DESIGN, REVIEW, TEST]) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });
});
