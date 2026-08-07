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

interface Layer {
  id: string;
  consumer_skill: string;
  test_outputs: Record<string, string[]>;
}

const LAYERS = (JSON.parse(read('docs/layers.json')) as { layers: Layer[] }).layers;
const APP_SKILL = read('.claude/skills/kiwa-app/SKILL.md');

/**
 * Where a declared output path is anchored.
 *
 * `test_outputs` mixes three anchors under one placeholder. Two of them name
 * kiwa's own layout and cannot be written into somebody else's project, so the
 * entry point has to tell them apart rather than substitute blindly.
 */
type Anchor = 'project-root' | 'kiwa-examples' | 'kiwa-fixtures' | 'no-placeholder';

function anchorOf(path: string): Anchor {
  if (path.startsWith('{example}/')) return 'project-root';
  if (path.startsWith('examples/{example}/')) return 'kiwa-examples';
  if (path.includes('tests/fixtures/{example}/')) return 'kiwa-fixtures';
  if (path.includes('{example}')) return 'kiwa-examples';
  return 'no-placeholder';
}

function allOutputPaths(): { layer: string; skill: string; path: string }[] {
  return LAYERS.flatMap((layer) =>
    Object.entries(layer.test_outputs ?? {}).flatMap(([skill, paths]) =>
      (paths ?? []).map((path) => ({ layer: layer.id, skill, path })),
    ),
  );
}

describe('the declared output paths carry three different anchors', () => {
  // The entry point substitutes `{example}` with the project root. That is only
  // correct for one of the three shapes the field actually holds — the other two
  // name kiwa's own layout, and substituting into them writes `examples/tests/…`
  // into a project that has no `examples/`.
  it('counts each anchor, so a new shape has to be classified', () => {
    const counts = allOutputPaths().reduce<Record<string, number>>((acc, entry) => {
      const anchor = anchorOf(entry.path);
      acc[anchor] = (acc[anchor] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      'project-root': 22,
      'kiwa-examples': 10,
      'kiwa-fixtures': 3,
    });
  });

  it('names the layers that cannot be written into somebody else\'s project', () => {
    // A layer is reachable from a user's project when at least one of its
    // declared paths is anchored there. Ten are not: the Rust and Go layers
    // spell `examples/{example}/…`, which is kiwa's own directory.
    //
    // Both anchors on one producer is normal — `contract` writes the project's
    // test and kiwa's fixture copy from the same skill — so this asks whether a
    // project-anchored path exists, not whether it is the only one.
    const unreachable = LAYERS.filter(
      (layer) =>
        !Object.values(layer.test_outputs ?? {})
          .flat()
          .some((path) => anchorOf(path) === 'project-root'),
    ).map((layer) => layer.id);
    expect(unreachable.sort()).toEqual(
      [
        'go-echo',
        'go-fiber',
        'go-gin',
        'go-integration',
        'go-unit',
        'rust-actix-web',
        'rust-axum',
        'rust-integration',
        'rust-tower-http',
        'rust-unit',
      ].sort(),
    );
  });
});

describe('the entry point states which anchors it can write', () => {
  it('names all three and matches the measured counts', () => {
    // Prose drifts from data silently. Writing the counts into the skill and
    // checking them here means adding a path of a new shape breaks the check
    // rather than the generated output.
    expect(APP_SKILL).toMatch(/\{example\}\/\.\.\..*\|\s*22\s*\|/);
    expect(APP_SKILL).toMatch(/examples\/\{example\}\/\.\.\..*\|\s*10\s*\|/);
    expect(APP_SKILL).toMatch(/tests\/fixtures\/\{example\}\/\.\.\..*\|\s*3\s*\|/);
  });

  it('says it skips the anchors it cannot resolve', () => {
    expect(APP_SKILL).toMatch(/対象外/);
    expect(APP_SKILL).toMatch(/飛ばす|飛ばした/);
  });
});

describe('the entry point does not re-derive what the CLI already answers', () => {
  it('does not carry a layer to skill mapping of its own', () => {
    // 25 SKILL.md files carrying the same routing is what #1807 / #1809 / #1810
    // were about. `consumer_skill` comes back from `kiwa layers --json`, so a
    // table here would be a second copy that drifts.
    const named = LAYERS.filter((layer) => APP_SKILL.includes(`/${layer.consumer_skill}`));
    // `/kiwa-design` and `/kiwa-test` are named deliberately: one is the Layer 1
    // step, the other is the sibling this skill is distinguished from.
    const allowed = new Set(['kiwa-design', 'kiwa-test']);
    expect(named.filter((layer) => !allowed.has(layer.consumer_skill)).map((l) => l.id)).toEqual([]);
  });

  it('reads the layers through the CLI rather than the table', () => {
    expect(APP_SKILL).toContain('kiwa layers --json');
    expect(APP_SKILL).not.toContain('docs/layers.json');
  });
});

describe('the two orchestrators stay distinct', () => {
  const TEST_SKILL = read('.claude/skills/kiwa-test/SKILL.md');

  it('kiwa-test still drives the examples from the repo root', () => {
    // If this stops holding, the reason to have a second entry point is gone and
    // the split should be revisited rather than silently kept.
    expect(TEST_SKILL).toMatch(/cwd = kiwa repo root/);
    expect(TEST_SKILL).toContain('examples/$EXAMPLE');
  });

  it('kiwa-app does not require the repo root', () => {
    // Scoped to the section that states requirements. The skill names the phrase
    // elsewhere to say what it is *not* — a mention is not a requirement, which
    // is the same distinction `skill-layer-routing.test.ts` draws for outputs.
    const start = APP_SKILL.indexOf('## 前提');
    const end = APP_SKILL.indexOf('## 引数仕様');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const premises = APP_SKILL.slice(start, end);
    expect(premises).not.toMatch(/cwd = kiwa repo root/);
    expect(premises).not.toContain('rev-parse --show-toplevel');
  });

  it('kiwa-app declares where it writes', () => {
    // A skill with no declared output is one whose files nobody expects.
    expect(APP_SKILL).toMatch(/tests\/reports\/app\//);
    expect(APP_SKILL).toMatch(/Write 権限/);
  });
});

describe('the entry point refuses to generate on an unnarrowed answer', () => {
  it('stops on source=all rather than emitting every layer', () => {
    // `all` means "could not narrow", not "everything applies". Generating on it
    // would write 30 layers of spec into a project that asked for its own.
    // Scoped to the row. A loose `/`all`.*生成せず/s` matched the argument list
    // ("`all` は全 layer" … "--dry-run 生成せず") 30 lines earlier and passed
    // with the row rewritten to generate everything.
    const row = APP_SKILL.split('\n').find((line) => line.startsWith('| `all` |'));
    expect(row).toBeDefined();
    expect(row).toMatch(/生成せず/);
    expect(row).not.toMatch(/全 layer を対象/);
    expect(LAYERS.length).toBeGreaterThan(25);
  });
});

describe('the entry point passes what the pieces it invokes actually need', () => {
  // The checks above read the skill against `layers.json`. These read it against
  // the *other skills* it starts, which is where the first review found three
  // defects that prose self-consistency could not see.
  const skillText = (name: string): string => read(`.claude/skills/${name}/SKILL.md`);

  const multiLayerConsumers = (): [string, string[]][] => {
    const byConsumer = new Map<string, string[]>();
    for (const layer of LAYERS) {
      byConsumer.set(layer.consumer_skill, [
        ...(byConsumer.get(layer.consumer_skill) ?? []),
        layer.id,
      ]);
    }
    return [...byConsumer].filter(([, ids]) => ids.length > 1);
  };

  it('four consumers serve more than one layer, so the layer has to travel', () => {
    // `kiwa-nextjs` converts five different things. Invoked with `--module`
    // alone it gets the same call five times and cannot tell which to write.
    const multi = multiLayerConsumers();
    expect(multi.map(([skill]) => skill).sort()).toEqual([
      'kiwa-api',
      'kiwa-go',
      'kiwa-nextjs',
      'kiwa-rust',
    ]);
  });

  it('hands the layer id to Layer 2, not only to Layer 1', () => {
    const step4 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 4'), APP_SKILL.indexOf('## Step 5'));
    const layer2Line = step4.split('\n').find((line) => line.includes('{consumer_skill}'));
    expect(layer2Line).toBeDefined();
    expect(layer2Line).toContain('--layer');
  });

  it('every consumer it hands --layer to documents that flag', () => {
    // Passing a flag nobody accepts is the same failure as passing none.
    const undocumented = multiLayerConsumers()
      .map(([skill]) => skill)
      .filter((skill) => !skillText(skill).includes('--layer'));
    expect(undocumented).toEqual([]);
  });

  it('passes --layer through to the CLI rather than branching on it first', () => {
    // The CLI owns flag > detected > all. Branching here makes `--layer all`
    // indistinguishable from "could not narrow", which is the opposite answer.
    // Scoped to the command line. `/kiwa layers --json.*--layer/s` matched the
    // prose two paragraphs below and passed with the flag removed from the
    // command — the fifth time this session that a `.` spanning newlines found
    // an unrelated mention.
    const step2 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 2'), APP_SKILL.indexOf('## Step 3'));
    const invocation = step2.split('\n').find((line) => line.trim().startsWith('kiwa layers'));
    expect(invocation).toBeDefined();
    expect(invocation).toContain('--layer');
    expect(APP_SKILL).toContain('--layer L');
  });

  it('does not claim the skills it starts leave execution to the user', () => {
    // Measured, not assumed: three of the Layer 2 skills run the tests they
    // write. A boundary stated without checking is the defect this catches.
    const runners = ['kiwa-forge', 'kiwa-hardhat', 'kiwa-vitest'].filter((skill) =>
      /forge test|hardhat test|vitest run/.test(skillText(skill)),
    );
    expect(runners).toHaveLength(3);

    const outOfScope = APP_SKILL.slice(APP_SKILL.indexOf('## 責務外'));
    expect(outOfScope).toMatch(/Layer 2 skill は自分が/);
    expect(outOfScope).not.toMatch(/走らせるのは利用者の runner/);
  });

  it('builds the spec path from the declaration rather than reassembling it', () => {
    // `spec_path` carries a per-layer suffix (`.rsc.md`, `.middleware.md`, …)
    // and Layer 2 finds its input by that suffix. Rebuilding the path from
    // `{spec_dir}` drops the suffix and the input stops being found.
    const suffixes = new Set(
      LAYERS.filter((l) => l.consumer_skill === 'kiwa-nextjs').map((l) =>
        (l as unknown as { spec_path: string }).spec_path.replace(/^.*\{module\}/, ''),
      ),
    );
    expect(suffixes.size).toBe(5);
    expect(APP_SKILL).toContain('spec_path');
    expect(APP_SKILL).toMatch(/spec_dir.*自前で組み立てない/s);
  });
});
