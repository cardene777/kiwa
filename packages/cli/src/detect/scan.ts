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

import { readCargoToml, readGoMod, readPackageJson, type Dependency } from './manifests.js';

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
  'Cargo.toml': { language: 'rust', read: readCargoToml },
  'go.mod': { language: 'go', read: readGoMod },
  'package.json': { language: 'typescript', read: readPackageJson },
};

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
 * How many levels below the working directory a manifest is still the project's
 * own.
 *
 * Counted as levels below the root, so 3 reaches `a/b/c/go.mod`. Passing this
 * to the walk as a remaining-budget with one already spent made it reach two,
 * which misses `apps/services/api` — a shape common enough that the runtime
 * would have been excluded on a search that never looked there.
 */
const DEPTH = 3;

/**
 * Which languages the project contains a manifest for, anywhere below.
 *
 * This answers a different question from `scan`, and the difference matters.
 * `scan` reads the members the project declares — honouring `!pkgs/skip`,
 * because a project excluding a directory from its workspace means it. That is
 * the right basis for reading dependencies.
 *
 * It is the wrong basis for concluding a language is absent. "No `go.mod` in
 * the directories a workspace file named" is much weaker than "no `go.mod`",
 * and a Go service in an undeclared `services/api` is invisible to it. Since
 * `resolveLayers` excludes a runtime's layers on absence, the absence has to be
 * established by looking rather than by not having been told.
 */
export function presentLanguages(cwd: string): string[] {
  const root = resolve(cwd);
  const found = new Set<string>();

  const visit = (dir: string, depth: number): void => {
    for (const [name, reader] of Object.entries(READERS)) {
      if (existsSync(join(dir, name))) found.add(reader.language);
    }
    if (depth <= 0) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP.has(entry.name) || entry.name.startsWith('.')) continue;
      visit(join(dir, entry.name), depth - 1);
    }
  };

  visit(root, DEPTH);
  return [...found].sort();
}

/** Every manifest worth reading, starting from `cwd`. */
export function scan(cwd: string): ScannedManifest[] {
  const root = resolve(cwd);
  const found: ScannedManifest[] = [];
  readManifestsIn(root, root, found);
  for (const dir of workspaceDirs(root)) readManifestsIn(dir, root, found);
  return found;
}
