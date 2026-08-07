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
  also_consumed_by: string[];
  test_outputs: Record<string, string[]>;
}

const LAYERS = (JSON.parse(read('docs/layers.json')) as { layers: Layer[] }).layers;

/**
 * The option list a skill declares, read from the section that declares options.
 *
 * Scanning the whole file finds `/kiwa-review --layer nextjs-server-action` and
 * reads it as a `--layer` option of the file's own skill. That mistake shipped
 * once already (#1841 Round 1), so the section boundary is the check.
 */
function declaredOptions(skill: string): string[] {
  const text = read(`.claude/skills/${skill}/SKILL.md`);
  const head = ['## オプション', '## 引数仕様', '## 引数'].find((h) => text.includes(h));
  if (!head) return [];
  const from = text.slice(text.indexOf(head) + 3);
  const next = from.indexOf('\n## ');
  const section = next >= 0 ? from.slice(0, next) : from;
  return [...new Set(section.match(/^- `(--[a-z][a-z-]*)/gm)?.map((m) => m.slice(3)) ?? [])];
}

/**
 * The path a skill writes to when `--output` is omitted, as its own docs state it.
 *
 * Two spellings are in use — `省略時は \`…\`` and `default \`…\`` — and both are
 * read. Normalising the wording is a separate change; reading only one of them
 * would report three skills as declaring no default when they do.
 */
function declaredDefault(skill: string): string | null {
  const line = read(`.claude/skills/${skill}/SKILL.md`)
    .split('\n')
    .find((l) => l.startsWith('- `--output {path}`'));
  if (!line) return null;
  return line.match(/(?:省略時は|default) `([^`]+)`/)?.[1] ?? null;
}

/** Every skill some layer names as a producer of test files. */
const producers = [
  ...new Set(
    LAYERS.flatMap((layer) => Object.keys(layer.test_outputs ?? {})).filter((skill) => {
      try {
        read(`.claude/skills/${skill}/SKILL.md`);
        return true;
      } catch {
        return false;
      }
    }),
  ),
].sort();

describe('a skill that writes test files can be told where to write them', () => {
  // Until this landed, one producer of seven could. `docs/layers.json` declares
  // where each layer's tests go, and changing that declaration did nothing for
  // six of them — they write to a path fixed in their own prose. Declaring one
  // thing and doing another is worse than not declaring it, because the entry
  // point reads the declaration and reports success.
  it('ten of the eighteen producers declare it, and the eight that do not are named', () => {
    // Not "all of them". Four of the remaining eight declare a glob or brace
    // expansion (`test/*.t.sol`, `test/unit/{module}.test.{ts,tsx}`) — they emit
    // more than one file, so `--output {path}` is the wrong shape for them and
    // the question of what shape fits is a separate one.
    //
    // Listing them by name means finishing the set has to update this, and
    // adding a producer that cannot be redirected fails here rather than
    // silently joining the backlog.
    const without = producers.filter((skill) => !declaredOptions(skill).includes('--output'));
    expect(without.sort()).toEqual([
      'kiwa-a11y',
      'kiwa-e2e',
      'kiwa-edge',
      'kiwa-forge',
      'kiwa-hardhat',
      'kiwa-play',
      'kiwa-ui',
      'kiwa-vitest',
    ]);
    expect(producers).toHaveLength(18);
  });

  it('every --output that exists states what it falls back to', () => {
    // An option with no stated default is one whose behaviour has to be read
    // out of the implementation, which is the state this replaces.
    const withFlag = producers.filter((skill) => declaredOptions(skill).includes('--output'));
    expect(withFlag).toHaveLength(10);
    expect(withFlag.filter((skill) => !declaredDefault(skill))).toEqual([]);
  });
});

describe('the stated default matches what the layer table declares', () => {
  // Two shapes exist today. Most skills state a project-relative path and the
  // table prefixes `{example}/`; Rust and Go state the `examples/` path itself.
  // The second shape is why those ten layers cannot be written into somebody
  // else's project (#1842) — recorded here so that fix has to update this.
  const anchored = (skill: string): string[] =>
    LAYERS.flatMap((layer) => layer.test_outputs?.[skill] ?? []);

  it('each default appears in the table, with or without the example prefix', () => {
    const mismatched: string[] = [];
    for (const skill of producers) {
      const fallback = declaredDefault(skill);
      if (!fallback) continue;
      const paths = anchored(skill);
      if (!paths.length) continue;
      const ok = paths.some((path) => path === fallback || path === `{example}/${fallback}`);
      if (!ok) mismatched.push(`${skill}: ${fallback} vs ${paths.join(', ')}`);
    }
    expect(mismatched).toEqual([]);
  });

  it('no skill states kiwa\'s own directory as its default', () => {
    // `kiwa-rust` and `kiwa-go` used to spell `examples/{example}/…`, which is
    // the kiwa repository's layout written into a skill that also runs in other
    // people's projects. Every default is now relative to the target root.
    const selfAnchored = producers.filter((skill) => declaredDefault(skill)?.startsWith('examples/'));
    expect(selfAnchored).toEqual([]);
  });
});

describe('the defaults are pinned so they cannot drift silently', () => {
  // `--output` was added without changing any of these (#1845); `#1842` then
  // changed the two Rust and Go entries deliberately, together with the table.
  // Pinning them means either kind of edit has to be stated here.
  it('each default is the value its own docs and the layer table agree on', () => {
    const before: Record<string, string> = {
      'kiwa-api': 'test/integration/{module}.test.ts',
      // #1844 で衝突を解くため spec の suffix を写した
      'kiwa-cli-test': 'tests/{module}.cli.test.ts',
      'kiwa-data': 'tests/{module}.data.test.ts',
      'kiwa-orm': 'tests/{module}.orm.test.ts',
      'kiwa-nextjs': 'tests/integration/{module}.nextjs.test.ts',
      // Changed by #1842 from `examples/{example}/…` to the target-root form.
      'kiwa-rust': 'tests/{module}.rs',
      'kiwa-go': '{module}_test.go',
    };
    for (const [skill, path] of Object.entries(before)) {
      expect(declaredDefault(skill)).toBe(path);
    }
  });

  it('says the paths named later are defaults, not fixed', () => {
    // Declaring `--output` and then naming a fixed path in every step leaves the
    // option inert: a reader following the steps writes to the hardcoded path.
    // Each skill states once that the paths it goes on to name are the defaults.
    const added = ['kiwa-api', 'kiwa-cli-test', 'kiwa-data', 'kiwa-orm', 'kiwa-rust', 'kiwa-go'];
    for (const skill of added) {
      const line = read(`.claude/skills/${skill}/SKILL.md`)
        .split('\n')
        .find((l) => l.startsWith('- `--output {path}`'));
      expect(line).toMatch(/以降の step と早見表/);
      expect(line).toMatch(/`--output` を渡した場合はそちらが優先/);
      // Scoped to the generated test. The 早見表 also lists coverage reports,
      // and "every path below" would hand those to `--output` too.
      expect(line).toMatch(/生成 test の/);
      expect(line).toMatch(/coverage report 等の他の出力先は `--output` の対象外/);
    }
  });

  it('the skills still name a concrete path in their steps', () => {
    // The note above is only meaningful because the steps do name paths. If a
    // skill stopped naming any, the note would be describing nothing.
    for (const skill of ['kiwa-api', 'kiwa-orm', 'kiwa-rust']) {
      const text = read(`.claude/skills/${skill}/SKILL.md`);
      const afterOptions = text.slice(text.indexOf('- `--output {path}`'));
      expect(afterOptions).toMatch(/\{module\}/);
    }
  });

  it('the two polyglot skills say what their paths are relative to', () => {
    // They used to spell `examples/{example}/…`, which said where the paths were
    // anchored by including it. Dropping the prefix removes that information, so
    // the anchor has to be stated instead — otherwise a reader of the table
    // cannot tell whether `tests/{module}.rs` is the repo root or the example.
    for (const skill of ['kiwa-rust', 'kiwa-go']) {
      const text = read(`.claude/skills/${skill}/SKILL.md`);
      expect(text).toMatch(/\*\*path の基準\*\*/);
      expect(text).toMatch(/対象 root からの相対/);
      expect(text).toMatch(/`examples\/\{name\}\/` が root/);
    }
  });

  it('a consumer serving several layers does not hardcode one of their paths', () => {
    // Splitting the declarations (#1844) is inert while the steps still name a
    // single literal: `kiwa-nextjs` ran `vitest tests/integration/{module}.nextjs.test.ts`
    // for all five modes, and `kiwa-cli-test` passed the old path to
    // `/kiwa-review`. Four skills carried this and none of the checks saw it.
    //
    // The lines that run or review the generated file have to name the resolved
    // output, not a path.
    const multi = ['kiwa-nextjs', 'kiwa-api', 'kiwa-cli-test', 'kiwa-data'];
    const offenders: string[] = [];
    for (const skill of multi) {
      const text = read(`.claude/skills/${skill}/SKILL.md`);
      const declaring = new Set(
        text
          .split('\n')
          .filter((l) => l.startsWith('- `--output') || l.trim().startsWith('|'))
          .map((l) => l.trim()),
      );
      for (const line of text.split('\n')) {
        // Only lines that run or review a *specific generated file*. A directory
        // (`vitest run test/integration/`) or a flag-only invocation
        // (`vitest run --coverage`) names no single output and is not the issue.
        const runsOrReviews = /vitest run|--test-path|出力 file 名は/.test(line);
        const namesOneFile = /\{module\}[^\s`]*\.(test\.tsx?|spec\.ts|rs|go)/.test(line);
        if (!runsOrReviews || !namesOneFile) continue;
        // The declaration itself is where the literal belongs.
        if (declaring.has(line.trim())) continue;
        if (!line.includes('解決した出力先') && !line.includes('解決済み出力先')) {
          offenders.push(`${skill}: ${line.trim().slice(0, 60)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the two skills with mode suffixes say the suffix is not added to an explicit path', () => {
    // `kiwa-rust` writes `{module}_axum.rs` under `--mode axum`. Applying that
    // to a caller-supplied path would rewrite the name it asked for.
    for (const skill of ['kiwa-rust', 'kiwa-go']) {
      const line = read(`.claude/skills/${skill}/SKILL.md`)
        .split('\n')
        .find((l) => l.startsWith('- `--output {path}`'));
      expect(line).toMatch(/suffix を足さない/);
    }
  });
});
