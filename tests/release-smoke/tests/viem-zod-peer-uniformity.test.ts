// Fail-fast detection for the viem/zod peer-split pattern (Issue #1787).
//
// `abitype` — reached from every `viem` install — declares `zod` as an *optional*
// peer accepting `^3.22.0 || ^4.0.0`. An importer that does not declare `zod`
// itself leaves the choice to pnpm's peer dedupe, and the dedupe result is not
// stable across lockfile regenerations. Two observed regenerations moved a
// different subset of importers each time:
//
//   * PR #1786 (package removal) moved `examples/dogfood-dapp-e2e-reorg` to v4.
//   * A single-importer `zod` declaration moved 16 *other* examples to v4.
//
// The damage is not the zod version itself. Every affected importer depends on
// `@kiwa-lab/dapp`, which declares `zod` and therefore resolves `viem` under a v3
// peer key. When an importer resolves `viem` under a v4 peer key, the importer and
// the adapter it exercises load **two different viem instances** — wallet clients,
// chain objects, and ABI caches stop being identity-comparable across that
// boundary.
//
// Scope of the invariant, stated precisely: this axis constrains **workspace
// importers only**. It does not claim the dependency graph holds a single `viem`
// copy — transitive consumers (`@reown/appkit`, `@walletconnect/*`) legitimately
// pin their own `viem` under other peer keys, and several such copies remain.
// What must hold is that no *importer* disagrees with `packages/dapp`.
//
// Three assertions, ordered from cause to symptom:
//
//   1. Every importer declaring `viem`/`wagmi` also declares `zod` at the
//      reference range. This is the *cause*: an undeclared importer is one
//      dedupe reshuffle away from splitting, even while the lockfile looks fine.
//   2. The lockfile parser observes every one of those importers. Without this,
//      a lockfile format change silently empties the parse and assertion 3
//      passes over nothing.
//   3. Every observed importer resolves `viem` under the same `zod` peer as
//      `packages/dapp`. This is the *symptom* the two regenerations produced.
//
// A workspace-wide `zod` override is NOT a valid fix for a failure here. It
// rewrites `better-call`'s peer (`^4.0.0`) as well, and Better Auth's
// `dist/state.mjs` calls `z.looseObject`, which the zod v3 root export lacks.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 levels up = repo root (mirrors the convention
// used by release-script-filter.test.ts and test-taxonomy-existence.test.ts).
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

// The published adapter every affected importer consumes. Its declaration is the
// single source for the expected range, so bumping the adapter to a new zod major
// makes this axis demand that the importers move with it rather than silently
// disagree.
const REFERENCE_IMPORTER = 'packages/dapp';

// Workspace roots that hold importers exercising viem. `packages` is included so
// the reference importer is discovered by the same code path as the rest.
const IMPORTER_ROOTS = ['examples', 'tests/fixtures', 'packages'] as const;

const VIEM_ENTRYPOINTS = ['viem', 'wagmi'] as const;

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface Declaration {
  /** Section that declares viem/wagmi — zod must live in the same one. */
  viemSection: 'dependencies' | 'devDependencies';
  zodRange: string | null;
  zodSection: 'dependencies' | 'devDependencies' | null;
}

function readPackageJson(rel: string): PackageJson | null {
  try {
    return JSON.parse(readFileSync(resolve(REPO_ROOT, rel), 'utf-8')) as PackageJson;
  } catch {
    return null;
  }
}

function sectionOf(pkg: PackageJson, name: string): 'dependencies' | 'devDependencies' | null {
  if (pkg.dependencies?.[name] !== undefined) return 'dependencies';
  if (pkg.devDependencies?.[name] !== undefined) return 'devDependencies';
  return null;
}

/**
 * Importers that declare viem or wagmi, keyed by the importer path pnpm uses in
 * the lockfile. Derived from `package.json` rather than the lockfile so that a
 * lockfile that fails to mention an importer is detectable as a gap.
 */
function declaredViemImporters(): Map<string, Declaration> {
  const out = new Map<string, Declaration>();

  for (const root of IMPORTER_ROOTS) {
    let entries: string[];
    try {
      entries = readdirSync(resolve(REPO_ROOT, root));
    } catch {
      continue;
    }

    for (const entry of entries) {
      const importer = `${root}/${entry}`;
      const pkg = readPackageJson(`${importer}/package.json`);
      if (pkg === null) continue;

      const viemSection = VIEM_ENTRYPOINTS.map((name) => sectionOf(pkg, name)).find(
        (s): s is 'dependencies' | 'devDependencies' => s !== null,
      );
      if (viemSection === undefined) continue;

      const zodSection = sectionOf(pkg, 'zod');
      out.set(importer, {
        viemSection,
        zodSection,
        zodRange: zodSection === null ? null : (pkg[zodSection]?.zod ?? null),
      });
    }
  }

  return out;
}

/**
 * Collect zod versions appearing inside the peer key of every `viem@…` reference
 * in a lockfile version string.
 *
 * A peer key is a run of sibling groups — `viem@2.52.0(a@1)(b@2)(zod@3.25.76)` —
 * so the run has to be consumed group by group rather than matched as one
 * parenthesised block. Scoping to the viem reference matters for `wagmi`, whose
 * version string also carries peers that have nothing to do with viem.
 */
function zodPeersOfViem(versionString: string): string[] {
  const out: string[] = [];
  const reference = /viem@[0-9][^()\s]*/g;

  let match: RegExpExecArray | null;
  while ((match = reference.exec(versionString)) !== null) {
    let cursor = match.index + match[0].length;
    const start = cursor;
    let depth = 0;

    while (cursor < versionString.length) {
      const char = versionString[cursor];
      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
        if (depth === 0 && versionString[cursor + 1] !== '(') {
          cursor += 1;
          break;
        }
      } else if (depth === 0) {
        break;
      }
      cursor += 1;
    }

    for (const zod of versionString.slice(start, cursor).matchAll(/zod@([0-9][^()]*)/g)) {
      if (zod[1] !== undefined) out.push(zod[1]);
    }
  }

  return out;
}

/** Importer → sorted zod versions backing its viem resolution. */
function readViemZodPeers(): Map<string, string[]> {
  const lock = readFileSync(resolve(REPO_ROOT, 'pnpm-lock.yaml'), 'utf-8');
  const found = new Map<string, string[]>();

  let inImporters = false;
  let importer: string | null = null;
  let dependency: string | null = null;

  for (const line of lock.split('\n')) {
    // Top-level key — marks entry into and exit from the importers section.
    const topLevel = /^(\S[^:]*):\s*$/.exec(line);
    if (topLevel?.[1] !== undefined) {
      inImporters = topLevel[1] === 'importers';
      importer = null;
      dependency = null;
      continue;
    }
    if (!inImporters) continue;

    // Importer name (depth 2), e.g. `.` or `examples/basic-connect`.
    const importerLine = /^ {2}(\S[^:]*):\s*$/.exec(line);
    if (importerLine?.[1] !== undefined) {
      importer = importerLine[1].replace(/^["']|["']$/g, '');
      dependency = null;
      continue;
    }
    if (importer === null) continue;

    // Dependency name (depth 6). Scoped names are quoted; pnpm uses single
    // quotes today, so accept both forms rather than depend on that.
    const dependencyLine = /^ {6}["']?([^\s:"']+)["']?:\s*$/.exec(line);
    if (dependencyLine?.[1] !== undefined) {
      dependency = dependencyLine[1];
      continue;
    }

    const versionLine = /^ {8}version: (.+)$/.exec(line);
    if (versionLine?.[1] === undefined) continue;
    if (dependency === null || !VIEM_ENTRYPOINTS.includes(dependency as (typeof VIEM_ENTRYPOINTS)[number])) {
      continue;
    }

    // A `viem` entry carries its peers without repeating its own name; prefixing
    // it lets one scanner serve both entrypoints.
    const scoped = dependency === 'viem' ? `viem@${versionLine[1]}` : versionLine[1];
    const zods = zodPeersOfViem(scoped);
    if (zods.length === 0) continue;

    // Union rather than assignment: an importer may reach viem through both
    // `viem` and `wagmi`, and through both dependency sections. Overwriting
    // would let a later agreeing entry mask an earlier disagreeing one.
    const previous = found.get(importer) ?? [];
    found.set(importer, [...new Set([...previous, ...zods])].sort());
  }

  return found;
}

describe('viem/zod peer uniformity', () => {
  const declared = declaredViemImporters();
  const peers = readViemZodPeers();

  it('declares zod in every importer that declares viem or wagmi', () => {
    const reference = declared.get(REFERENCE_IMPORTER);
    expect(
      reference?.zodRange,
      `${REFERENCE_IMPORTER} must declare zod — it is the range every other importer follows.`,
    ).toBeTruthy();

    const problems = [...declared.entries()]
      .filter(([name]) => name !== REFERENCE_IMPORTER)
      .flatMap(([name, decl]) => {
        if (decl.zodRange === null) {
          return [`${name}: declares ${decl.viemSection}.viem/wagmi but no zod`];
        }
        if (decl.zodRange !== reference?.zodRange) {
          return [`${name}: zod ${decl.zodRange} (expected ${reference?.zodRange})`];
        }
        if (decl.zodSection !== decl.viemSection) {
          return [`${name}: zod is in ${decl.zodSection}, viem/wagmi in ${decl.viemSection}`];
        }
        return [];
      });

    expect(
      problems,
      `Add "zod": "${reference?.zodRange}" to each listed importer, in the same section that ` +
        'declares viem/wagmi, then regenerate the lockfile with `pnpm install`. Leaving an ' +
        'importer undeclared lets pnpm pick the version, and that pick moves between ' +
        'regenerations even when the current lockfile looks correct.',
    ).toEqual([]);
  });

  it('observes every declared importer in the lockfile', () => {
    // Guards against a lockfile format change silently emptying the parse. A
    // count-based floor would not catch it: partial drift can leave the
    // reference importer readable while the rest vanish, and the comparison in
    // the next assertion would then hold vacuously.
    expect(declared.size).toBeGreaterThan(0);

    const missing = [...declared.keys()].filter((name) => !peers.has(name));

    expect(
      missing,
      'These importers declare viem/wagmi but no viem resolution was parsed from ' +
        'pnpm-lock.yaml. Either the lockfile is stale (run `pnpm install`) or its format ' +
        'changed and readViemZodPeers() needs updating — do not delete this assertion.',
    ).toEqual([]);
  });

  it('resolves viem under the same zod peer in every importer', () => {
    const reference = peers.get(REFERENCE_IMPORTER);
    expect(
      reference,
      `No viem resolution parsed for ${REFERENCE_IMPORTER}; the comparison below has no baseline.`,
    ).toBeDefined();
    expect(
      reference,
      `${REFERENCE_IMPORTER} resolves viem under ${reference?.length ?? 0} zod peers; expected ` +
        'exactly one. More than one means the reference itself is split.',
    ).toHaveLength(1);

    const mismatched = [...peers.entries()]
      .filter(([, zods]) => zods.join(',') !== reference?.join(','))
      .map(([name, zods]) => `${name} → zod ${zods.join(',')}`);

    expect(
      mismatched,
      `${REFERENCE_IMPORTER} resolves viem under zod ${reference?.join(',')}. A listed importer ` +
        'loads a second viem instance, so values crossing between it and @kiwa-lab/dapp stop ' +
        'being identity-comparable. Align the zod declarations and regenerate the lockfile.',
    ).toEqual([]);
  });
});
