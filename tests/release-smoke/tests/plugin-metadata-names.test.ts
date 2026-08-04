// Fail-fast detection for stale names in the published plugin metadata (Issue #1788).
//
// `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` are what a user reads
// before installing. When packages or skills are removed, the counts are easy to remember to
// update and the prose is not — PR #1786 removed 15 packages and 6 skills, corrected both
// counts, and still left Nuxt, SvelteKit, Remix, Astro, Qwik City, MCP, Agent, Payment, and
// Streaming described as current features, plus `release-invariants` among the keywords.
//
// Two attempts to strip those names by string substitution corrupted the surrounding prose
// (`App Router ... 3 v2`, `file://` collapsed to `file:/`).
//
// So the metadata is generated rather than edited, and the primary assertion here compares the
// committed files against `scripts/rebuild-plugin-metadata.mjs` output. That makes a stale
// name impossible to express rather than merely detectable: the generator reads
// `docs/libraries.json` and `.claude/skills/`, so a removed package cannot appear in its
// output at all.
//
// The earlier version of this axis checked names with a denylist and a keyword allowlist
// instead. Review showed both directions of error — `Qwik City` and `Svelte Kit` bypassed the
// denylist on spelling, while `streaming` and `email` were banned as ordinary words. The
// canonical comparison has neither failure mode.
//
// The remaining assertions cover what the comparison cannot: whether the generator's own
// prose template names things that exist, and whether the counts stated outside the generated
// files still agree.
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 levels up = repo root.
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');
const GENERATOR = resolve(REPO_ROOT, 'scripts/rebuild-plugin-metadata.mjs');

interface NativePackage {
  name: string;
  registry: string;
  dir: string;
}

interface Generator {
  buildMetadata: () => {
    plugin: Record<string, unknown>;
    marketplace: Record<string, unknown>;
    packages: string[];
    skills: string[];
    version: string;
  };
  NATIVE_PACKAGES: NativePackage[];
}

function read(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

describe('plugin metadata names', () => {
  let generator: Generator;
  let built: ReturnType<Generator['buildMetadata']>;

  beforeAll(async () => {
    generator = (await import(pathToFileURL(GENERATOR).href)) as unknown as Generator;
    built = generator.buildMetadata();
  });

  it('loads the generator and real lists', () => {
    // A generator that threw, or lists that came back empty, would make the comparison below
    // pass against equally empty output.
    expect(built.packages.length).toBeGreaterThan(0);
    expect(built.skills.length).toBeGreaterThan(0);
    expect(built.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('matches the generator output byte for byte', () => {
    // The load-bearing assertion. Everything the metadata says about packages, skills, counts,
    // and the version is derived here, so drift in any of them shows up as a diff.
    for (const [rel, key] of [
      ['.claude-plugin/plugin.json', 'plugin'],
      ['.claude-plugin/marketplace.json', 'marketplace'],
    ] as const) {
      expect(
        read(rel),
        `${rel} does not match the generator. Run: node scripts/rebuild-plugin-metadata.mjs`,
      ).toBe(serialize(built[key]));
    }
  });

  it('names language-native packages that exist', () => {
    // These ship outside the npm workspace, so the generator carries them as a literal list
    // and nothing else would notice one being deleted.
    const missing = generator.NATIVE_PACKAGES.filter(
      (n) => !existsSync(resolve(REPO_ROOT, n.dir)),
    ).map((n) => `${n.name} (expected ${n.dir}/)`);

    expect(
      missing,
      'These language-native packages are advertised but their directories are gone. Remove ' +
        'them from NATIVE_PACKAGES in scripts/rebuild-plugin-metadata.mjs and regenerate.',
    ).toEqual([]);
  });

  it('references only packages that exist', () => {
    // Guards the generator's prose template, which names packages by hand. The trailing
    // token cannot end in `.`, so a sentence-final period stays out while `@kiwa-lab/api.foo`
    // and `@kiwa-lab/api_extra` are read whole instead of as the real `api`.
    const text = serialize(built.plugin) + serialize(built.marketplace);
    const referenced = [...text.matchAll(/@kiwa-lab\/([A-Za-z0-9._-]*[A-Za-z0-9_-])/g)]
      .map((m) => m[1])
      .filter((n): n is string => n !== undefined);
    const unknown = [...new Set(referenced)].filter((n) => !built.packages.includes(n));

    expect(
      unknown,
      'The generator prose names @kiwa-lab/* packages that do not exist. Fix the template in ' +
        'scripts/rebuild-plugin-metadata.mjs.',
    ).toEqual([]);
  });

  it('references only skills that exist', () => {
    // Claude Code namespaces plugin skills, so `/kiwa:kiwa-play` is the same reference as
    // `/kiwa-play` and has to be matched too.
    const text = serialize(built.plugin) + serialize(built.marketplace);
    const referenced = [...text.matchAll(/\/(?:kiwa:)?(kiwa-[A-Za-z0-9._-]*[A-Za-z0-9_-]|kiwa-)/g)]
      .map((m) => m[1])
      .filter((n): n is string => n !== undefined);
    const unknown = [...new Set(referenced)].filter((n) => !built.skills.includes(n));

    expect(
      unknown,
      'The generator prose advertises /kiwa-* skills with no directory under .claude/skills/. ' +
        'Fix the template in scripts/rebuild-plugin-metadata.mjs.',
    ).toEqual([]);
  });

  it('states the current skill count in README', () => {
    // README is not generated, so the count there drifts independently. Only the sections
    // describing the current plugin are checked — the Roadmap and migration notes keep their
    // historical figures on purpose.
    const readme = read('README.md');
    const current = [
      /### 1\. Claude Code skills \((\d+) skills/,
      /After install, all (\d+) skills appear/,
      /\*\*SSOT for all (\d+) skills\*\*/,
    ].map((re) => re.exec(readme)?.[1]);

    expect(
      current.filter((n) => n === undefined),
      'A README sentence that states the skill count changed shape; the assertion can no ' +
        'longer find it. Update the pattern rather than deleting the check.',
    ).toEqual([]);
    expect(
      [...new Set(current)],
      `README states a skill count that disagrees with the ${built.skills.length} directories ` +
        'under .claude/skills/.',
    ).toEqual([String(built.skills.length)]);
  });
});
