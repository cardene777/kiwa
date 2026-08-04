// Fail-fast detection for stale names in the published plugin metadata (Issue #1788).
//
// `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` are what a user reads
// before installing. When packages or skills are removed, the counts are easy to remember to
// update and the prose is not — PR #1786 removed 15 packages and 6 skills, corrected both
// counts, and still left Nuxt, SvelteKit, Remix, Astro, Qwik City, MCP, Agent, Payment, and
// Streaming described as current features, plus `release-invariants` among the keywords.
//
// Two attempts to strip those names by string substitution corrupted the surrounding prose
// (`App Router ... 3 v2`, `file://` collapsed to `file:/`). The metadata is therefore
// regenerated from the real package and skill lists rather than edited in place, and this axis
// holds the result to those lists.
//
// What is checked:
//
//   1. Both files parse as JSON.
//   2. Every `@kiwa-lab/<name>` mentioned anywhere in the metadata is a real package.
//   3. Every `/kiwa-<slug>` skill invocation mentioned is a real skill directory.
//   4. Every keyword is a real package, a real language-native package, or an explicitly
//      allow-listed concept term. This is what keeps a removed package name from surviving in
//      `keywords`, where prose review would not catch it.
//   5. Every current package appears in `keywords`, so a newly added package is not silently
//      left out of discovery.
//   6. The counts stated in the prose match the real number of packages and skills.
//
// When this test fails, regenerate the metadata from the current lists rather than editing the
// offending string — that is the failure mode this axis exists to prevent.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 levels up = repo root.
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

// Packages published outside the npm workspace, so they do not appear in docs/libraries.json.
const NATIVE_PACKAGES = ['kiwa-test-py', 'kiwa-test-rs', 'kiwa-test-go'] as const;

// Keywords that describe what kiwa does rather than naming a package. Anything not on this
// list must resolve to a real package, which is what stops a removed package name from
// lingering here. Add a term only when it is genuinely a concept, not a shortcut around a
// failing assertion.
const CONCEPT_KEYWORDS = [
  'kiwa',
  'testing',
  'test-framework',
  'e2e',
  'end-to-end',
  'playwright',
  'vitest',
  'foundry',
  'hardhat',
  'anvil',
  'viem',
  'wagmi',
  'solidity',
  'smart-contract',
  'dapp',
  'web3',
  'ethereum',
  'accessibility',
  'a11y',
  'visual-regression',
  'spec-driven',
  'claude-code',
  'claude-code-plugin',
  'agent-skills',
  'monorepo',
  'typescript',
  'python',
  'rust',
  'golang',
] as const;

interface LibrariesJson {
  libraryCategories: { packages: string[] }[];
}

interface PluginJson {
  description?: string;
  keywords?: string[];
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(resolve(REPO_ROOT, rel), 'utf-8')) as T;
}

function currentPackages(): string[] {
  const libraries = readJson<LibrariesJson>('docs/libraries.json');
  return libraries.libraryCategories.flatMap((c) => c.packages);
}

function currentSkills(): string[] {
  return readdirSync(resolve(REPO_ROOT, '.claude/skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

describe('plugin metadata names', () => {
  const packages = currentPackages();
  const skills = currentSkills();
  const plugin = readJson<PluginJson>('.claude-plugin/plugin.json');
  const marketplace = readJson<Record<string, unknown>>('.claude-plugin/marketplace.json');

  // Every string the two files contain, so a name cannot hide in a field the test forgot.
  const metadataText = [
    readFileSync(resolve(REPO_ROOT, '.claude-plugin/plugin.json'), 'utf-8'),
    readFileSync(resolve(REPO_ROOT, '.claude-plugin/marketplace.json'), 'utf-8'),
  ].join('\n');

  it('reads real package and skill lists', () => {
    // A parse that silently returns nothing would make every assertion below vacuous.
    expect(packages.length).toBeGreaterThan(0);
    expect(skills.length).toBeGreaterThan(0);
    expect(marketplace).toBeTypeOf('object');
  });

  it('references only packages that exist', () => {
    const referenced = [...metadataText.matchAll(/@kiwa-lab\/([a-z0-9-]+)/g)]
      .map((m) => m[1])
      .filter((n): n is string => n !== undefined);
    const unknown = [...new Set(referenced)].filter((n) => !packages.includes(n));

    expect(
      unknown,
      'These @kiwa-lab/* names appear in the plugin metadata but have no package directory. ' +
        'Regenerate the metadata from docs/libraries.json rather than deleting the substring.',
    ).toEqual([]);
  });

  it('references only skills that exist', () => {
    const referenced = [...metadataText.matchAll(/\/(kiwa-[a-z0-9-]+)/g)]
      .map((m) => m[1])
      .filter((n): n is string => n !== undefined);
    const unknown = [...new Set(referenced)].filter((n) => !skills.includes(n));

    expect(
      unknown,
      'These /kiwa-* skills are advertised in the plugin metadata but have no directory under ' +
        '.claude/skills/. Remove them from the prose or restore the skill.',
    ).toEqual([]);
  });

  it('keeps keywords limited to real packages and declared concepts', () => {
    const keywords = plugin.keywords ?? [];
    expect(keywords.length).toBeGreaterThan(0);

    const allowed = new Set<string>([...packages, ...NATIVE_PACKAGES, ...CONCEPT_KEYWORDS]);
    const stale = keywords.filter((k) => !allowed.has(k));

    expect(
      stale,
      'These keywords are neither a current package nor a declared concept term. A removed ' +
        'package name reaching this list is the failure this axis exists to catch — delete it, ' +
        'or add it to CONCEPT_KEYWORDS if it really describes what kiwa does.',
    ).toEqual([]);
  });

  it('lists every current package in keywords', () => {
    const keywords = new Set(plugin.keywords ?? []);
    const missing = packages.filter((p) => !keywords.has(p));

    expect(
      missing,
      'These packages exist but are not discoverable through the plugin keywords. Regenerate ' +
        'the keyword list from docs/libraries.json.',
    ).toEqual([]);
  });

  it('states counts that match the real lists', () => {
    const description = plugin.description ?? '';

    const packageCount = /(\d+)\s+npm packages/.exec(description)?.[1];
    expect(
      packageCount,
      'The description no longer states an npm package count; the count assertion cannot run.',
    ).toBeDefined();
    expect(Number(packageCount)).toBe(packages.length);

    const skillCount = /(\d+)\s+Claude Code skills/.exec(description)?.[1];
    expect(
      skillCount,
      'The description no longer states a skill count; the count assertion cannot run.',
    ).toBeDefined();
    expect(Number(skillCount)).toBe(skills.length);
  });
});
