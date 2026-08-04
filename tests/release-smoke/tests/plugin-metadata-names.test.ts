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
//
// A term that is also a package name must NOT appear here — it would keep the keyword valid
// after the package is removed, which is exactly the failure this axis exists to catch. The
// `declares no concept term that shadows a package` assertion enforces that.
const CONCEPT_KEYWORDS = [
  'kiwa',
  'testing',
  'test-framework',
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
  'web3',
  'ethereum',
  'accessibility',
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

// Packages and skills removed in PR #1786. Their names lived in the metadata prose and
// keywords for a full release after removal, and prose mentions are not caught by the
// "must be a real package" assertions below — a bare `payment` in a sentence matches no
// `@kiwa-lab/` prefix. This list is the direct guard against that specific regression.
// Entries are never removed; a name that once shipped and was withdrawn stays banned.
const WITHDRAWN_NAMES = [
  'agent',
  'astro',
  'design-check',
  'desktop',
  'email',
  'mcp',
  'mobile',
  'nuxt',
  'payment',
  'qwikcity',
  'release-invariants',
  'remix',
  'security-devsecops',
  'streaming',
  'sveltekit',
  'kiwa-astro',
  'kiwa-email',
  'kiwa-nuxt',
  'kiwa-qwikcity',
  'kiwa-remix',
  'kiwa-sveltekit',
] as const;

interface LibrariesJson {
  libraryCategories: { packages: string[] }[];
}

interface PluginJson {
  description?: string;
  keywords?: string[];
  version?: string;
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

  // Every string *value* in both files, so a name cannot hide in a field the test forgot.
  // Values under a `email` key are skipped: the maintainer's address contains the word
  // `email`, which would collide with the withdrawn `@kiwa-lab/email` package name. Keys are
  // excluded too — matching them would flag `"email":` itself.
  function collectStrings(node: unknown, key?: string): string[] {
    if (typeof node === 'string') return key === 'email' ? [] : [node];
    if (Array.isArray(node)) return node.flatMap((v) => collectStrings(v));
    if (node !== null && typeof node === 'object') {
      return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
        collectStrings(v, k),
      );
    }
    return [];
  }

  const metadataText = [
    ...collectStrings(plugin),
    ...collectStrings(marketplace),
  ].join('\n');

  it('reads real package and skill lists', () => {
    // A parse that silently returns nothing would make every assertion below vacuous.
    expect(packages.length).toBeGreaterThan(0);
    expect(skills.length).toBeGreaterThan(0);
    expect(marketplace).toBeTypeOf('object');
  });

  it('declares no concept term that shadows a package', () => {
    // A concept term equal to a package name would stay valid after that package is removed,
    // silently defeating the keyword assertion below.
    const shadowing = CONCEPT_KEYWORDS.filter((k) => packages.includes(k));

    expect(
      shadowing,
      'These concept terms are also package names. Remove them from CONCEPT_KEYWORDS — they are ' +
        'already allowed as packages, and keeping them here would keep the keyword valid after ' +
        'the package is deleted.',
    ).toEqual([]);
  });

  it('references only packages that exist', () => {
    // The trailing boundary keeps `@kiwa-lab/api_extra` from being read as the real `api`.
    const referenced = [...metadataText.matchAll(/@kiwa-lab\/([a-z0-9-]+)(?![a-z0-9-_])/g)]
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
    // Claude Code namespaces plugin skills, so `/kiwa:kiwa-play` is the same reference as
    // `/kiwa-play` and has to be matched too.
    const referenced = [...metadataText.matchAll(/\/(?:kiwa:)?(kiwa-[a-z0-9-]+)/g)]
      .map((m) => m[1])
      .filter((n): n is string => n !== undefined);
    const unknown = [...new Set(referenced)].filter((n) => !skills.includes(n));

    expect(
      unknown,
      'These /kiwa-* skills are advertised in the plugin metadata but have no directory under ' +
        '.claude/skills/. Remove them from the prose or restore the skill.',
    ).toEqual([]);
  });

  it('never reintroduces a withdrawn package or skill name', () => {
    // Prose mentions carry no `@kiwa-lab/` prefix, so the assertions above cannot see them.
    const found = WITHDRAWN_NAMES.filter((name) =>
      new RegExp(`(?<![a-z0-9-])${name}(?![a-z0-9-])`, 'i').test(metadataText),
    );

    expect(
      found,
      'These names belong to packages or skills removed in PR #1786 and must not appear in the ' +
        'published metadata. They described features the plugin no longer ships.',
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
    // Both files state counts, and the marketplace entry also names a version. Scanning every
    // string value catches a stale figure wherever it lives — the drift this axis was written
    // for had the plugin description on v1.42 and the marketplace on v2.17 while the real
    // version was 2.19.0.
    const packageCounts = [...metadataText.matchAll(/(\d+)\s+npm packages/g)].map((m) =>
      Number(m[1]),
    );
    expect(
      packageCounts.length,
      'No npm package count is stated anywhere in the metadata; the assertion cannot run.',
    ).toBeGreaterThan(0);
    expect(
      [...new Set(packageCounts)],
      `Stated npm package counts disagree with the ${packages.length} packages in docs/libraries.json.`,
    ).toEqual([packages.length]);

    const skillCounts = [...metadataText.matchAll(/(\d+)\s+(?:Claude Code )?skills/g)].map((m) =>
      Number(m[1]),
    );
    expect(
      skillCounts.length,
      'No skill count is stated anywhere in the metadata; the assertion cannot run.',
    ).toBeGreaterThan(0);
    expect(
      [...new Set(skillCounts)],
      `Stated skill counts disagree with the ${skills.length} directories under .claude/skills/.`,
    ).toEqual([skills.length]);

    const versions = [...metadataText.matchAll(/\bv(\d+\.\d+\.\d+)\b/g)].map((m) => m[1]);
    expect(
      [...new Set(versions)].filter((v) => v !== plugin.version),
      `Version strings in the metadata disagree with plugin.json version ${plugin.version}.`,
    ).toEqual([]);
  });
});
