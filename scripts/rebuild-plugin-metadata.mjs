#!/usr/bin/env node
// Rebuilds the published plugin metadata from the real package and skill lists.
//
// `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` are what a user reads
// before installing. PR #1786 removed 15 packages and 6 skills; the counts were corrected and
// the prose was not, leaving withdrawn features advertised as current for a full release.
// Two attempts to strip the names by string substitution corrupted the surrounding prose
// (`App Router ... 3 v2`, `file://` collapsed to `file:/`).
//
// So the metadata is generated, never hand-edited. `docs/libraries.json` is the source for
// npm packages and `.claude/skills/` for skills, which makes a stale name impossible to
// express rather than merely detectable.
//
// Usage:
//   node scripts/rebuild-plugin-metadata.mjs           # write the files
//   node scripts/rebuild-plugin-metadata.mjs --check   # exit 1 if the files are out of date
//
// `tests/release-smoke/tests/plugin-metadata-names.test.ts` imports `buildMetadata` and
// compares its output to the committed files, so the check runs on every release-smoke run.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '..');

// Packages published outside the npm workspace. Each entry names the directory that must
// exist, so deleting one fails the generator rather than silently leaving stale prose.
export const NATIVE_PACKAGES = [
  { name: 'kiwa-test-py', registry: 'PyPI', dir: 'kiwa-py' },
  { name: 'kiwa-test-rs', registry: 'crates.io', dir: 'kiwa-rs' },
  { name: 'kiwa-test-go', registry: 'Go module', dir: 'kiwa-go' },
];

// Search terms that describe what kiwa does. A term equal to a package name must not appear
// here — the package list already contributes those, and duplicating one would keep the
// keyword alive after the package is removed.
export const CONCEPT_KEYWORDS = [
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
];

const CATEGORY_LABELS = {
  foundation: 'foundation',
  frameworks: 'web frameworks',
  services: 'services',
  'ai-realtime': 'AI and realtime',
  quality: 'quality and security',
};

function readJson(rel) {
  return JSON.parse(readFileSync(resolve(REPO_ROOT, rel), 'utf-8'));
}

export function readCategories() {
  return readJson('docs/libraries.json').libraryCategories.map((c) => ({
    slug: c.slug,
    packages: c.packages,
  }));
}

export function readSkills() {
  return readdirSync(resolve(REPO_ROOT, '.claude/skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/** Builds both metadata documents from the current package and skill lists. */
export function buildMetadata() {
  const categories = readCategories();
  const packages = categories.flatMap((c) => c.packages);
  const skills = readSkills();
  const version = readJson('.claude-plugin/plugin.json').version;

  for (const label of categories.map((c) => c.slug)) {
    if (CATEGORY_LABELS[label] === undefined) {
      throw new Error(`docs/libraries.json has category "${label}" with no English label`);
    }
  }

  const shadowing = CONCEPT_KEYWORDS.filter((k) => packages.includes(k));
  if (shadowing.length > 0) {
    throw new Error(`CONCEPT_KEYWORDS duplicate package names: ${shadowing.join(', ')}`);
  }

  const areas = categories
    .map((c) => `${CATEGORY_LABELS[c.slug]} (${c.packages.join(', ')})`)
    .join('; ');
  const native = NATIVE_PACKAGES.map((n) => `${n.name} (${n.registry})`).join(', ');

  const description = [
    'Test toolchain for application boundaries. One Layer 1 spec generates the test layers a ' +
      'stack actually needs — Solidity contracts, dApp end-to-end, browser end-to-end, HTTP ' +
      'APIs, React components, CLI and file I/O, data pipelines, accessibility, and visual ' +
      'regression.',
    `${packages.length} npm packages under @kiwa-lab/ cover five areas: ${areas}. ` +
      `Three language-native packages ship separately: ${native}.`,
    `${skills.length} Claude Code skills drive the chain. /kiwa-design writes the spec. ` +
      '/kiwa-forge and /kiwa-hardhat turn it into Foundry and Hardhat contract tests. ' +
      '/kiwa-play covers dApp end-to-end on anvil forks with Playwright and viem. ' +
      '/kiwa-vitest, /kiwa-api, /kiwa-ui, /kiwa-data, /kiwa-cli-test, and /kiwa-e2e cover the ' +
      'remaining layers. /kiwa-review scores spec and test coverage, and /kiwa-test ' +
      'orchestrates the contract, dApp, browser, Next.js, Rust, and Go chains.',
    'Pre-release. All rights reserved until general availability; see LICENSE.',
  ].join('\n\n');

  const keywords = [
    ...new Set([...CONCEPT_KEYWORDS, ...packages, ...NATIVE_PACKAGES.map((n) => n.name)]),
  ].sort();

  const marketplaceDescription =
    'kiwa — test toolchain for application boundaries, distributed as a single Claude Code ' +
    `plugin. ${skills.length} skills generate and run the test layers a stack needs, backed ` +
    `by ${packages.length} npm packages and three language-native packages. Pre-release; ` +
    'all rights reserved.';

  const pluginEntryDescription =
    `kiwa v${version} — ${skills.length} skills in one plugin. Install it in a project and ` +
    'Claude Code can write a Layer 1 test spec with /kiwa-design, generate Foundry or Hardhat ' +
    'contract tests with /kiwa-forge and /kiwa-hardhat, drive dApp end-to-end runs on anvil ' +
    'forks with /kiwa-play, cover unit, API, component, data, CLI, and browser layers with ' +
    '/kiwa-vitest, /kiwa-api, /kiwa-ui, /kiwa-data, /kiwa-cli-test, and /kiwa-e2e, review spec ' +
    'and test coverage with /kiwa-review, and orchestrate the contract, dApp, browser, ' +
    'Next.js, Rust, and Go chains with /kiwa-test.';

  const plugin = { ...readJson('.claude-plugin/plugin.json'), description, keywords };

  const marketplace = readJson('.claude-plugin/marketplace.json');
  marketplace.description = marketplaceDescription;
  marketplace.plugins = marketplace.plugins.map((entry) =>
    entry.name === 'kiwa' ? { ...entry, description: pluginEntryDescription } : entry,
  );

  return { plugin, marketplace, packages, skills, version };
}

const FILES = [
  ['.claude-plugin/plugin.json', 'plugin'],
  ['.claude-plugin/marketplace.json', 'marketplace'],
];

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main() {
  const check = process.argv.includes('--check');
  const built = buildMetadata();
  let stale = 0;

  for (const [rel, key] of FILES) {
    const expected = serialize(built[key]);
    const actual = readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
    if (expected === actual) continue;
    stale += 1;
    if (check) {
      console.error(`${rel} is out of date; run: node scripts/rebuild-plugin-metadata.mjs`);
    } else {
      writeFileSync(resolve(REPO_ROOT, rel), expected);
      console.log(`${rel} rewritten`);
    }
  }

  if (check && stale > 0) process.exit(1);
  console.log(
    `${built.packages.length} packages / ${built.skills.length} skills / v${built.version}` +
      (check ? ' — metadata up to date' : ''),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
