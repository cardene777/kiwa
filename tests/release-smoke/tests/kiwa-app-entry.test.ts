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
    // Nothing declares kiwa's own `examples/` directory; the three that remain
    // are kiwa's internal fixtures, which are not a user's artefact and are
    // skipped rather than substituted.
    expect(counts).toEqual({
      'project-root': 22,
      'kiwa-fixtures': 3,
    });
  });

  it('names the layers that cannot be written into somebody else\'s project', () => {
    // A layer is reachable from a user's project when at least one of its
    // declared paths is anchored there. Ten were not: the Rust and Go layers
    // spelled `examples/{example}/…`, which is kiwa's own directory. #1842
    // moved them and #1864 removed those layers, so the answer is now none —
    // which is what this pins, not the count.
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
    expect(unreachable).toEqual([]);
  });
});

describe('the entry point states which anchors it can write', () => {
  it('names all three and matches the measured counts', () => {
    // Derived from the table, not written twice. Checking the skill against
    // literals let both sides go stale together: #1842 moved ten paths and the
    // skill still said 10 while the data said 0, with this check green.
    const counts = allOutputPaths().reduce<Record<string, number>>((acc, entry) => {
      const anchor = anchorOf(entry.path);
      acc[anchor] = (acc[anchor] ?? 0) + 1;
      return acc;
    }, {});
    const row = (label: string, n: number): RegExp =>
      new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\|\\s*${n}\\s*\\|`);

    expect(APP_SKILL).toMatch(row('{example}/...', counts['project-root'] ?? 0));
    expect(APP_SKILL).toMatch(row('examples/{example}/...', counts['kiwa-examples'] ?? 0));
    expect(APP_SKILL).toMatch(row('tests/fixtures/{example}/...', counts['kiwa-fixtures'] ?? 0));
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
    // Scoped to the step that reads. The skill names `docs/layers.json` once,
    // in Step 4, to say where a data problem belongs — naming a file is not
    // reading it, and the unscoped check could not tell the two apart.
    expect(APP_SKILL).toContain('kiwa layers --json');
    const step2 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 2'), APP_SKILL.indexOf('## Step 3'));
    expect(step2).not.toContain('docs/layers.json');
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

describe('the entry point passes what the pieces it invokes actually need', () => {
  // These read the skill against the *other skills* it starts. The first two
  // rounds both found defects here that prose self-consistency could not see —
  // and the first attempt at these checks was itself vacuous, matching
  // `/kiwa-review --layer nextjs-server-action` inside another skill's body and
  // reading it as that skill declaring a `--layer` option of its own.
  //
  // So the option list is parsed from the section that declares options, and
  // nowhere else.
  function declaredOptions(skill: string): string[] | null {
    let text: string;
    try {
      text = read(`.claude/skills/${skill}/SKILL.md`);
    } catch {
      return null;
    }
    // Matched as a whole line: `includes('## オプション')` also matches
    // `## オプション (何か)`, so renaming a heading kept its options visible.
    const lines = text.split('\n');
    const headIndex = lines.findIndex((line) =>
      ['## オプション', '## 引数仕様', '## 引数'].includes(line.trim()),
    );
    if (headIndex === -1) return [];
    const from = lines.slice(headIndex + 1).join('\n');
    const next = from.indexOf('\n## ');
    const section = next >= 0 ? from.slice(0, next) : from;
    return [...new Set(section.match(/^- `(--[a-z][a-z-]*)/gm)?.map((m) => m.slice(3)) ?? [])];
  }

  const consumers = [...new Set(LAYERS.map((l) => l.consumer_skill))].sort();
  const declaring = (option: string): string[] =>
    consumers.filter((skill) => declaredOptions(skill)?.includes(option));

  it('no Layer 2 consumer accepts --layer, so it cannot be sent to any of them', () => {
    // `kiwa-nextjs` serves five layers and does not take `--layer`. Sending it
    // means the flag is dropped and all five calls look the same. #1864 removed
    // the only two consumers that did take it.
    expect(declaring('--layer')).toEqual([]);
  });

  it('the spec path flag is spelled two different ways', () => {
    // Deciding one name and using it everywhere silently misses five skills.
    // The counts moved in #1851, which gave `kiwa-play` and `kiwa-edge` the
    // `--input-spec` they were missing.
    expect(declaring('--input-spec')).toHaveLength(11);
    // `kiwa-hardhat` also declares it but is not in this list: `consumers` is
    // built from `consumer_skill`, and hardhat reaches `contract` through
    // `also_consumed_by` instead.
    expect(declaring('--spec-path').sort()).toEqual([
      'kiwa-auth',
      'kiwa-cache',
      'kiwa-forge',
      'kiwa-queue',
    ]);
  });

  it('the skill states those counts rather than assuming one shape', () => {
    // Counted from the skills, not written twice. Literals here let the table
    // and the check go stale together: #1851 moved `--input-spec` from 11 to 13
    // and both sides kept saying 11 while passing.
    const step4 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 4'), APP_SKILL.indexOf('## Step 5'));
    const row = (flag: string, n: number): RegExp =>
      new RegExp(`\`${flag}\`.*?\\|\\s*(?:\\*\\*)?${n}(?:\\*\\*)?\\s*\\|`);

    for (const flag of ['--module', '--input-spec', '--spec-path', '--layer', '--provider']) {
      expect(step4).toMatch(row(flag, declaring(flag).length));
    }
  });

  it('says to read the consumer declaration instead of deciding the names here', () => {
    const step4 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 4'), APP_SKILL.indexOf('## Step 5'));
    expect(step4).toContain('## オプション');
    expect(step4).toMatch(/宣言されている名前で渡す/);
  });

  it('does not send --layer to Layer 2 unconditionally', () => {
    const step4 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 4'), APP_SKILL.indexOf('## Step 5'));
    const layer2Line = step4.split('\n').find((line) => line.includes('{consumer_skill}'));
    expect(layer2Line).toBeDefined();
    expect(layer2Line).not.toContain('--layer');
  });

  it('names the suffix that actually distinguishes the five Next.js layers', () => {
    // `kiwa-nextjs` tells them apart by the spec path it is handed, so the
    // resolved `spec_path` is the selector. Rebuilding it from `spec_dir` drops
    // the suffix and the distinction with it.
    const suffixes = LAYERS.filter((l) => l.consumer_skill === 'kiwa-nextjs').map((l) =>
      (l as unknown as { spec_path: string }).spec_path.replace(/^.*\{module\}/, ''),
    );
    expect(new Set(suffixes).size).toBe(5);
    const step4 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 4'), APP_SKILL.indexOf('## Step 5'));
    for (const suffix of suffixes) expect(step4).toContain(suffix);
    expect(step4).toMatch(/spec_dir.*組み立て直す/s);
  });

  it('tells an explicit --layer all apart from a fallback all', () => {
    // The CLI answers `all` for both. Branching on `source` alone makes the
    // explicit request generate nothing, which is the opposite of what it asked.
    const step2 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 2'), APP_SKILL.indexOf('## Step 3'));
    expect(step2).toMatch(/2 つの別の答えを 1 語で返す/);
    // Two tables now carry an `all` row: the one that reads `source`, and the
    // one that decides between the two meanings. Both are checked by position
    // in the branching table rather than by "some row somewhere says this".
    const branching = step2.slice(step2.indexOf('| 自分が受けた'));
    const explicit = branching.split('\n').filter((line) => line.startsWith('| `all` |'));
    expect(explicit).toHaveLength(1);
    expect(explicit[0]).toMatch(/全 layer を対象にする/);
    const fallback = branching.split('\n').filter((line) => line.startsWith('| 無し |'));
    expect(fallback).toHaveLength(1);
    expect(fallback[0]).toMatch(/生成せず/);
    // And the reading table hands off rather than deciding on its own.
    const reading = step2.slice(0, step2.indexOf('| 自分が受けた'));
    expect(reading.split('\n').filter((l) => l.startsWith('| `all` |'))[0]).toMatch(/下表で分岐/);
    expect(LAYERS.length).toBeGreaterThanOrEqual(20);
  });

  it('passes --layer through to the CLI rather than branching on it first', () => {
    const step2 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 2'), APP_SKILL.indexOf('## Step 3'));
    const invocation = step2.split('\n').find((line) => line.trim().startsWith('kiwa layers'));
    expect(invocation).toBeDefined();
    expect(invocation).toContain('--layer');
  });

  it('does not claim the skills it starts leave execution to the user', () => {
    const runners = ['kiwa-forge', 'kiwa-hardhat', 'kiwa-vitest'].filter((skill) =>
      /forge test|hardhat test|vitest run/.test(read(`.claude/skills/${skill}/SKILL.md`)),
    );
    expect(runners).toHaveLength(3);
    const outOfScope = APP_SKILL.slice(APP_SKILL.indexOf('## 責務外'));
    expect(outOfScope).toMatch(/Layer 2 skill は自分が/);
    expect(outOfScope).not.toMatch(/走らせるのは利用者の runner/);
  });

  it('measures which layer groups collide on their output path', () => {
    // The five Next.js layers take five different specs and declare one output
    // between them. Run in sequence each overwrites the last, so four of the
    // five generations vanish while the run still looks successful.
    const byOutput = new Map<string, string[]>();
    for (const layer of LAYERS) {
      for (const path of Object.values(layer.test_outputs ?? {}).flat()) {
        byOutput.set(path, [...(byOutput.get(path) ?? []), layer.id]);
      }
    }
    const collisions = [...byOutput]
      .filter(([, ids]) => ids.length > 1)
      .map(([path, ids]) => [path, ids.sort()] as const)
      .sort();
    // None left. Four groups collided once: the Next.js five, and `cli` /
    // `data` / `orm-query` across three consumers, were split in #1844 by
    // writing each layer's spec suffix into its output name. The last one was
    // the two polyglot unit / integration layers, which shared a file because
    // their runner treats one directory as integration tests — #1864 removed
    // that language entirely.
    expect(collisions).toEqual([]);
  });

  it('says what it does when outputs collide, rather than overwriting', () => {
    const step4 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 4'), APP_SKILL.indexOf('## Step 5'));
    expect(step4).toMatch(/黙って上書きしない/);
    // The escape hatch depends on the consumer accepting `--output`.
    expect(declaredOptions('kiwa-nextjs')).toContain('--output');
    expect(step4).toContain('--output');
  });

  it('the secondary consumer has its own output entry, not the primary one', () => {
    // `contract` is the only layer with a second consumer. Reusing the primary's
    // path would have `kiwa-hardhat` write to the `.t.sol` slot `kiwa-forge`
    // owns — the same overwrite as the collision above, one level down.
    const withSecondary = LAYERS.filter(
      (l) => ((l as unknown as { also_consumed_by: string[] }).also_consumed_by ?? []).length > 0,
    );
    expect(withSecondary.map((l) => l.id)).toEqual(['contract']);

    for (const layer of withSecondary) {
      const secondaries = (layer as unknown as { also_consumed_by: string[] }).also_consumed_by;
      for (const skill of secondaries) {
        expect(Object.keys(layer.test_outputs)).toContain(skill);
        // Different artefacts, so a shared path would be wrong even in principle.
        expect(layer.test_outputs[skill]).not.toEqual(layer.test_outputs[layer.consumer_skill]);
      }
    }
    const step4 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 4'), APP_SKILL.indexOf('## Step 5'));
    expect(step4).toMatch(/consumer 別に鍵が分かれている/);
  });

  it('both consumers of that layer are asked for their own options', () => {
    // They happen to declare the same nine. The skill says that is a measured
    // fact rather than an assumption, because the check that follows is what
    // would catch it changing.
    const contract = LAYERS.find((l) => l.id === 'contract')!;
    const secondaries = (contract as unknown as { also_consumed_by: string[] }).also_consumed_by;
    for (const skill of [contract.consumer_skill, ...secondaries]) {
      expect(declaredOptions(skill)).toContain('--spec-path');
    }
    const step4 = APP_SKILL.slice(APP_SKILL.indexOf('## Step 4'), APP_SKILL.indexOf('## Step 5'));
    expect(step4).toMatch(/option も相手ごとに読む/);
  });

  it('every consumer declares at least one option', () => {
    // `kiwa-edge` had no option section until #1851. Reading a declaration that
    // does not exist means finding nothing to pass, and the entry point had to
    // skip the layer rather than guess at flag names.
    expect(consumers.filter((skill) => declaredOptions(skill)?.length === 0)).toEqual([]);
  });
});
