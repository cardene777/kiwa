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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';
import { skillDirNames, skillsWithSkillMd } from './skill-md.js';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 levels up = repo root.
const REPO_ROOT = repoRoot(HERE);
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
  checkNativePackages: () => { name: string; ok: boolean; reason?: string }[];
  checkPackageDirectories: (packages: string[]) => {
    missingDirectory: string[];
    unlisted: string[];
  };
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

  it('advertises language-native packages their manifests still declare', () => {
    // These ship outside the npm workspace, so nothing else notices one being renamed or
    // deleted. Checking the directory alone is not enough — review renamed the advertised
    // name to `kiwa-test-pythonx` and every assertion still passed.
    const broken = generator
      .checkNativePackages()
      .filter((n) => !n.ok)
      .map((n) => `${n.name}: ${n.reason}`);

    expect(
      broken,
      'These language-native packages are advertised but their manifests say otherwise. ' +
        'Update NATIVE_PACKAGES in scripts/rebuild-plugin-metadata.mjs and regenerate.',
    ).toEqual([]);
  });

  it('lists packages that exist on disk, and no others', () => {
    // docs/libraries.json is the generator's source, so a package deleted from disk but left
    // in the list would be advertised forever. The reverse direction catches a new package
    // that was never added to the list.
    const { missingDirectory, unlisted } = generator.checkPackageDirectories(built.packages);

    expect(
      missingDirectory,
      'docs/libraries.json lists packages with no directory under packages/. The metadata ' +
        'advertises them because the generator trusts that file.',
    ).toEqual([]);
    expect(
      unlisted,
      'These packages exist but are absent from docs/libraries.json, so the metadata does ' +
        'not mention them.',
    ).toEqual([]);
  });

  it('counts only skill directories that hold a SKILL.md', () => {
    // A directory left behind after SKILL.md is deleted is not a skill. Review removed
    // kiwa-play/SKILL.md and the count stayed at 29 with the metadata still advertising it.
    // 全 dir から SKILL.md を持つものを引く = 本検査が見たいのは「残された空 dir」 で、
    // 列挙を「SKILL.md を持つもの」 に畳むと対象そのものが消える (#1922)。
    const withManifest = new Set(skillsWithSkillMd());
    const withoutManifest = skillDirNames().filter((name) => !withManifest.has(name));

    expect(
      built.skills.filter((s) => withoutManifest.includes(s)),
      'The generator counted skill directories that have no SKILL.md.',
    ).toEqual([]);
  });

  it('rejects malformed package and skill references', () => {
    // Review found `@kiwa-lab/api~removed` extracted as the real `api`, and
    // `/kiwa::kiwa-removed` extracted nothing at all — both let a corrupted template pass the
    // "only real names" assertions below. Anything following the prefix that is not a valid
    // name is a failure in itself.
    const text = serialize(built.plugin) + serialize(built.marketplace);
    const malformed = [
      ...[...text.matchAll(/@kiwa-lab\/(\S+)/g)]
        .map((m) => m[1])
        .filter((n): n is string => n !== undefined)
        .filter((n) => !/^[a-z0-9]+(-[a-z0-9]+)*[.,;:)]?$/.test(n)),
      ...[...text.matchAll(/\/kiwa:+(\S+)/g)]
        .map((m) => m[0])
        .filter((n): n is string => n !== undefined)
        .filter((n) => !/^\/kiwa:kiwa-[a-z0-9]+(-[a-z0-9]+)*[.,;:)]?$/.test(n)),
    ];

    expect(
      malformed,
      'These references are not well-formed package or skill names. Fix the template in ' +
        'scripts/rebuild-plugin-metadata.mjs.',
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
