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
// Every free-text field is generated. An earlier revision carried the marketplace entry
// forward with a spread, which left `tags` untouched — review demonstrated that injecting
// `nuxt`, `release-invariants`, and six other withdrawn names into `tags` survived
// regeneration and passed every check. Only identity fields are carried now, and the carried
// set is closed: an unexpected field in `plugin.json` fails the build rather than riding
// along unvalidated.
//
// Usage:
//   node scripts/rebuild-plugin-metadata.mjs           # write the files
//   node scripts/rebuild-plugin-metadata.mjs --check   # exit 1 if the files are out of date
//
// `tests/release-smoke/tests/plugin-metadata-names.test.ts` imports `buildMetadata` and
// compares its output to the committed files, so the check runs on every release-smoke run.
import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './lib/is-main-module.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '..');

// Packages published outside the npm workspace. `manifest` and `declares` let the test confirm
// the advertised name still matches what the package actually publishes — the directory
// existing is not enough, since renaming the package inside it would go unnoticed.
export const NATIVE_PACKAGES = [
  {
    name: 'kiwa-test-py',
    registry: 'PyPI',
    dir: 'kiwa-py',
    manifest: 'kiwa-py/pyproject.toml',
    declares: /^\s*name\s*=\s*["']([^"']+)["']/m,
  },
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
];

// Marketplace tags are a shorter, search-facing subset. Generated for the same reason as
// keywords: the hand-maintained list is where withdrawn names would survive.
export const MARKETPLACE_TAGS = [
  'testing',
  'test-framework',
  'end-to-end',
  'playwright',
  'vitest',
  'foundry',
  'hardhat',
  'anvil',
  'solidity',
  'smart-contract',
  'web3',
  'ethereum',
  'accessibility',
  'axe-core',
  'visual-regression',
  'pixelmatch',
  'wcag',
  'claude-code',
  'claude-code-plugin',
  'spec-driven',
];

// Fields carried from the existing plugin manifest. These identify the plugin rather than
// describing what it ships, so they are maintained by hand. The set is closed — a field
// outside it fails the build, which stops a new free-text field from escaping generation the
// way `tags` did.
const PLUGIN_IDENTITY_FIELDS = [
  'name',
  'displayName',
  'version',
  'author',
  'homepage',
  'repository',
  'license',
  'skills',
];
const PLUGIN_GENERATED_FIELDS = ['description', 'keywords'];

const MARKETPLACE_ENTRY_NAME = 'kiwa';
const MARKETPLACE_ENTRY_SOURCE = './';
const MARKETPLACE_ENTRY_CATEGORY = 'testing';

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

/**
 * Skill directories that actually hold a skill. A directory left behind after `SKILL.md` is
 * deleted is not a skill — review showed the count staying at 29 with the file removed, so
 * the manifest is what counts, not the directory.
 */
export function readSkills() {
  return readdirSync(resolve(REPO_ROOT, '.claude/skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => existsSync(resolve(REPO_ROOT, '.claude/skills', name, 'SKILL.md')))
    .sort();
}

/** Native packages whose manifest still declares the advertised name. */
export function checkNativePackages() {
  return NATIVE_PACKAGES.map((n) => {
    const manifestPath = resolve(REPO_ROOT, n.manifest);
    if (!existsSync(manifestPath)) return { ...n, ok: false, reason: `${n.manifest} is missing` };
    const declared = n.declares.exec(readFileSync(manifestPath, 'utf-8'))?.[1];
    if (declared !== n.name) {
      return { ...n, ok: false, reason: `${n.manifest} declares "${declared ?? '(none)'}"` };
    }
    return { ...n, ok: true };
  });
}

/** Packages listed in docs/libraries.json that have no directory, and the reverse. */
export function checkPackageDirectories(packages) {
  const listed = new Set(packages);
  const onDisk = new Set(
    readdirSync(resolve(REPO_ROOT, 'packages'), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => existsSync(resolve(REPO_ROOT, 'packages', name, 'package.json'))),
  );
  return {
    missingDirectory: [...listed].filter((p) => !onDisk.has(p)).sort(),
    unlisted: [...onDisk].filter((p) => !listed.has(p)).sort(),
  };
}

/** Builds both metadata documents from the current package and skill lists. */
export function buildMetadata() {
  const categories = readCategories();
  const packages = categories.flatMap((c) => c.packages);
  const skills = readSkills();
  const existing = readJson('.claude-plugin/plugin.json');
  const version = existing.version;

  for (const slug of categories.map((c) => c.slug)) {
    if (CATEGORY_LABELS[slug] === undefined) {
      throw new Error(`docs/libraries.json has category "${slug}" with no English label`);
    }
  }

  const unexpected = Object.keys(existing).filter(
    (k) => !PLUGIN_IDENTITY_FIELDS.includes(k) && !PLUGIN_GENERATED_FIELDS.includes(k),
  );
  if (unexpected.length > 0) {
    throw new Error(
      `plugin.json has fields this generator does not own: ${unexpected.join(', ')}. ` +
        'Add them to PLUGIN_IDENTITY_FIELDS (hand-maintained) or generate them.',
    );
  }

  for (const [label, list] of [
    ['CONCEPT_KEYWORDS', CONCEPT_KEYWORDS],
    ['MARKETPLACE_TAGS', MARKETPLACE_TAGS],
  ]) {
    const shadowing = list.filter((k) => packages.includes(k));
    if (shadowing.length > 0) {
      throw new Error(`${label} duplicates package names: ${shadowing.join(', ')}`);
    }
  }

  const areas = categories
    .map((c) => `${CATEGORY_LABELS[c.slug]} (${c.packages.join(', ')})`)
    .join('; ');
  const native = NATIVE_PACKAGES.map((n) => `${n.name} (${n.registry})`).join(', ');

  // 0 件になったら文そのものを出さない。 件数だけを差し替える形にすると
  // 「0 language-native packages ship separately: .」 という壊れた文になる。
  const nativeSentence = NATIVE_PACKAGES.length
    ? ` ${NATIVE_PACKAGES.length === 1 ? 'One language-native package ships' : `${NATIVE_PACKAGES.length} language-native packages ship`} separately: ${native}.`
    : '';

  // `/kiwa-test` is described by the chains it actually runs. Its SKILL.md defines execution
  // steps for contract, dApp and browser only — Next.js ships as the standalone
  // /kiwa-nextjs skill and is not wired into the orchestrator.
  //
  // The native-package count is derived rather than written, because #1864 removed two of
  // the three and a literal would have kept advertising them.
  const description = [
    'Test toolchain for application boundaries. One Layer 1 spec generates the test layers a ' +
      'stack actually needs — Solidity contracts, dApp end-to-end, browser end-to-end, HTTP ' +
      'APIs, React components, CLI and file I/O, data pipelines, accessibility, and visual ' +
      'regression.',
    `${packages.length} npm packages under @kiwa-lab/ cover five areas: ${areas}.${nativeSentence}`,
    `${skills.length} Claude Code skills drive the chain. /kiwa-design writes the spec. ` +
      '/kiwa-forge and /kiwa-hardhat turn it into Foundry and Hardhat contract tests. ' +
      '/kiwa-play covers dApp end-to-end on anvil forks with Playwright and viem. ' +
      '/kiwa-vitest, /kiwa-api, /kiwa-ui, /kiwa-data, /kiwa-cli-test, and /kiwa-e2e cover the ' +
      'remaining layers. /kiwa-review scores spec and test coverage, and /kiwa-test ' +
      'orchestrates the contract, dApp and browser chains.',
    'Pre-release. All rights reserved until general availability; see LICENSE.',
  ].join('\n\n');

  const keywords = [
    ...new Set([...CONCEPT_KEYWORDS, ...packages, ...NATIVE_PACKAGES.map((n) => n.name)]),
  ].sort();

  const marketplaceDescription =
    'kiwa — test toolchain for application boundaries, distributed as a single Claude Code ' +
    `plugin. ${skills.length} skills generate and run the test layers a stack needs, backed ` +
    `by ${packages.length} npm packages${
      NATIVE_PACKAGES.length
        ? ` and ${NATIVE_PACKAGES.length} language-native package${NATIVE_PACKAGES.length === 1 ? '' : 's'}`
        : ''
    }. Pre-release; ` +
    'all rights reserved.';

  const entryDescription =
    `kiwa v${version} — ${skills.length} skills in one plugin. Install it in a project and ` +
    'Claude Code can write a Layer 1 test spec with /kiwa-design, generate Foundry or Hardhat ' +
    'contract tests with /kiwa-forge and /kiwa-hardhat, drive dApp end-to-end runs on anvil ' +
    'forks with /kiwa-play, cover unit, API, component, data, CLI, and browser layers with ' +
    '/kiwa-vitest, /kiwa-api, /kiwa-ui, /kiwa-data, /kiwa-cli-test, and /kiwa-e2e, review spec ' +
    'and test coverage with /kiwa-review, and orchestrate the contract, dApp and browser ' +
    'chains with /kiwa-test.';

  const plugin = {};
  for (const key of PLUGIN_IDENTITY_FIELDS) plugin[key] = existing[key];
  plugin.description = description;
  plugin.keywords = keywords;

  const existingMarketplace = readJson('.claude-plugin/marketplace.json');
  const marketplace = {
    name: existingMarketplace.name,
    description: marketplaceDescription,
    owner: existingMarketplace.owner,
    // Built field by field rather than spread: a carried-over free-text field is exactly how
    // withdrawn names survived regeneration before.
    plugins: [
      {
        name: MARKETPLACE_ENTRY_NAME,
        source: MARKETPLACE_ENTRY_SOURCE,
        description: entryDescription,
        version,
        author: existing.author,
        homepage: existing.homepage,
        repository: existing.repository,
        license: existing.license,
        category: MARKETPLACE_ENTRY_CATEGORY,
        tags: [...MARKETPLACE_TAGS],
      },
    ],
  };

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

// The entry check lives in `scripts/lib/is-main-module.mjs`; this file is where the
// defect it fixes was first found (a `--check` run that exited 0 without checking).
if (isMainModule(process.argv[1], import.meta.url)) main();
