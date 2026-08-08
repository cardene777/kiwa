/**
 * Find the manifests a project actually keeps its dependencies in.
 *
 * In a monorepo the root `package.json` holds tooling and the real dependencies
 * sit in `apps/web` or `packages/*`. Reading only the working directory finds
 * nothing there, and reading everything below it finds `node_modules` and
 * unrelated sub-projects. The middle ground is to read what the workspace
 * definition names — one level, declared by the project itself.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { readPackageJson, type Dependency } from './manifests.js';

/** Drop a trailing YAML comment, which `[a, b] # note` would otherwise carry. */
function stripHash(line: string): string {
  const at = line.indexOf('#');
  return at === -1 ? line : line.slice(0, at);
}

export interface ScannedManifest {
  /** Relative to the directory the scan started from, for the report. */
  path: string;
  language: string;
  deps: Dependency[];
}

const READERS: Record<string, { language: string; read: (source: string) => Dependency[] }> = {
  'package.json': { language: 'typescript', read: readPackageJson },
};

/**
 * Manifests whose presence is checked but whose contents are never read.
 *
 * Two different questions live in this file. `scan` asks "what does this
 * project depend on", which needs a reader. `presentManifests` asks "does this
 * project contain any Solidity", which needs only a filename.
 *
 * Solidity has the second without the first: no signal maps a Solidity
 * dependency to a layer, so there is nothing to read — but `foundry.toml` and
 * `hardhat.config.*` say plainly that the language is there. Without them the
 * `contract` layer can never be ruled out, and every Next.js project is offered
 * a Solidity test layer (measured on five real applications).
 *
 * Two build systems, either of which counts. Hardhat's config carries an
 * extension that varies, so the match is by prefix; `foundry.toml` is exact.
 */
const PRESENCE_ONLY: { language: string; matches: (name: string) => boolean }[] = [
  {
    language: 'solidity',
    matches: (name) => name === 'foundry.toml' || name.startsWith('hardhat.config.'),
  },
];

function readManifestsIn(dir: string, root: string, out: ScannedManifest[]): void {
  for (const [name, reader] of Object.entries(READERS)) {
    const full = join(dir, name);
    if (!existsSync(full)) continue;
    let source: string;
    try {
      source = readFileSync(full, 'utf-8');
    } catch {
      continue;
    }
    const rel = full.startsWith(root) ? full.slice(root.length + 1) || name : full;
    out.push({ path: rel, language: reader.language, deps: reader.read(source) });
  }
}

/**
 * The directories a workspace definition names, one level deep.
 *
 * Globs are expanded a single level (`packages/*`), which is the shape every
 * workspace definition in practice uses. A deeper glob is read as its literal
 * prefix rather than walked, so an unusual layout yields fewer directories
 * instead of a filesystem crawl.
 */
function workspaceDirs(root: string): string[] {
  const patterns: string[] = [];

  const pnpm = join(root, 'pnpm-workspace.yaml');
  if (existsSync(pnpm)) {
    try {
      for (const line of readFileSync(pnpm, 'utf-8').split('\n')) {
        const m = /^\s*-\s*["']?([^"'#]+?)["']?\s*$/.exec(line);
        if (m) {
          patterns.push(m[1]!);
          continue;
        }
        // `packages: [apps/*, libs/*]` is the same list written inline, and
        // reading only the block form scanned the root manifest alone in a
        // monorepo that uses it.
        const flow = /^\s*packages\s*:\s*\[([^\]]*)\]\s*$/.exec(stripHash(line));
        if (flow) {
          for (const item of flow[1]!.split(',')) {
            const value = item.trim().replace(/^["']|["']$/g, '');
            if (value) patterns.push(value);
          }
        }
      }
    } catch {
      // A workspace file we cannot read means no children, not a failure.
    }
  }

  const pkg = join(root, 'package.json');
  if (existsSync(pkg)) {
    try {
      const parsed = JSON.parse(readFileSync(pkg, 'utf-8')) as { workspaces?: unknown };
      const ws = parsed.workspaces;
      const list = Array.isArray(ws) ? ws : (ws as { packages?: string[] })?.packages;
      if (Array.isArray(list)) patterns.push(...list.filter((p): p is string => typeof p === 'string'));
    } catch {
      // Same.
    }
  }

  const dirs = new Set<string>();
  const excluded: string[] = [];

  for (const pattern of patterns) {
    if (pattern.startsWith('!')) {
      excluded.push(pattern.slice(1));
      continue;
    }
    const star = pattern.indexOf('*');
    if (star === -1) {
      const full = join(root, pattern);
      if (existsSync(full)) dirs.add(full);
      continue;
    }
    // Only `prefix/*` is expanded. A deeper pattern like `packages/*/nested`
    // used to expand to `packages/*` — the same directories, one level short of
    // what was asked for — so the scan read siblings of the intended members.
    // Reading less is the safe failure here; reading the wrong directory is not.
    if (pattern.slice(star) !== '*') continue;
    const base = join(root, pattern.slice(0, star).replace(/\/$/, ''));
    if (!existsSync(base)) continue;
    try {
      for (const entry of readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name !== 'node_modules') dirs.add(join(base, entry.name));
      }
    } catch {
      // Unreadable directory: skip rather than abort the scan.
    }
  }

  // `!pattern` removes a member the earlier globs added. Ignoring it read
  // directories the project had explicitly excluded.
  for (const pattern of excluded) {
    const star = pattern.indexOf('*');
    if (star === -1) {
      dirs.delete(join(root, pattern));
      continue;
    }
    const prefix = join(root, pattern.slice(0, star));
    for (const dir of [...dirs]) {
      if (dir.startsWith(prefix)) dirs.delete(dir);
    }
  }

  return [...dirs];
}

/**
 * Directories a search must not descend into.
 *
 * Dependencies and build output hold thousands of manifests describing other
 * people's projects, and `node_modules` alone would bury the project's own.
 */
const SKIP = new Set([
  'node_modules',
  '.git',
  'target',
  'dist',
  'build',
  'out',
  '.next',
  'vendor',
  '.venv',
  'coverage',
  '.turbo',
]);

/**
 * How many directories the search will open before giving up.
 *
 * A cap rather than a depth limit. A depth limit makes every project with a
 * service one level further down look like a project without one, and there is
 * no depth that is right for every layout — the previous bound of three missed
 * `apps/services/api`, and four would miss the next shape. A cap bounds the
 * cost without pretending to know where manifests live, and reaching it is
 * reported rather than treated as an answer.
 */
const VISIT_CAP = 20_000;

export interface ManifestPresence {
  /** Every manifest found, relative to the directory the search started from. */
  manifests: { path: string; language: string }[];
  /**
   * Whether the search finished. When false it ran out of budget or could not
   * open a directory, so a manifest being absent from the list means nothing
   * was found *so far* — not that the project does not contain it.
   */
  complete: boolean;
}

/**
 * Every manifest the project contains, found by looking rather than by being
 * told.
 *
 * This answers a different question from `scan`, and the difference matters.
 * `scan` reads the members the project declares — honouring `!pkgs/skip`,
 * because a project excluding a directory from its workspace means it. That is
 * the right basis for reading dependencies.
 *
 * It is the wrong basis for concluding something is absent. "No `foundry.toml`
 * in the directories a workspace file named" is much weaker than "no
 * `foundry.toml`", and a contract project in an undeclared `services/chain` is
 * invisible to it. Since `resolveLayers` excludes a runtime's layers on
 * absence, the absence has to be established by looking.
 *
 * Paths rather than languages, because the same distinction applies one level
 * down: a second `package.json` the workspace does not declare leaves the
 * language set unchanged while carrying a framework nobody read.
 *
 * Which is also why the result says whether the looking finished.
 */
export function presentManifests(cwd: string, cap: number = VISIT_CAP): ManifestPresence {
  const root = resolve(cwd);
  const found: { path: string; language: string }[] = [];
  let budget = cap;
  let missed = false;

  const visit = (dir: string): void => {
    if (budget <= 0) {
      missed = true;
      return;
    }
    budget -= 1;

    // Relative to the search root, matching what `scan` records, so the two
    // can be compared without either side normalising the other's paths.
    const relative = (name: string): string => {
      const full = join(dir, name);
      return full.startsWith(root) ? full.slice(root.length + 1) || name : full;
    };

    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      // A directory we cannot open is a part of the project we did not see.
      // Skipping it quietly and still reporting the search as finished is the
      // same mistake as ignoring the budget: it turns "we could not look" into
      // "there is nothing there".
      missed = true;
      return;
    }
    // Both kinds are matched against the listing rather than probed by name.
    // `hardhat.config.*` has an extension this file has no business
    // enumerating, and the listing already says what is a file.
    //
    // That last part is the reason the readers moved here too. Probing with
    // `existsSync` answers yes for a directory, so a directory named
    // `Cargo.toml` was reported as a Rust manifest and kept Rust's five layers
    // from ever being excluded. Measured, not hypothesised — before #1864
    // removed that reader. The shape is the reader's, not Rust's, so the same
    // probe would do the same to `package.json`.
    for (const entry of entries) {
      if (entry.isDirectory()) continue;
      const reader = READERS[entry.name];
      if (reader) found.push({ path: relative(entry.name), language: reader.language });
      for (const kind of PRESENCE_ONLY) {
        if (kind.matches(entry.name)) {
          found.push({ path: relative(entry.name), language: kind.language });
        }
      }
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP.has(entry.name) || entry.name.startsWith('.')) continue;
      visit(join(dir, entry.name));
    }
  };

  visit(root);
  found.sort((a, b) => a.path.localeCompare(b.path));
  return { manifests: found, complete: !missed };
}

/** Every manifest worth reading, starting from `cwd`. */
export function scan(cwd: string): ScannedManifest[] {
  const root = resolve(cwd);
  const found: ScannedManifest[] = [];
  readManifestsIn(root, root, found);
  for (const dir of workspaceDirs(root)) readManifestsIn(dir, root, found);
  return found;
}
