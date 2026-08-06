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
        if (m) patterns.push(m[1]!);
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
  for (const pattern of patterns) {
    if (pattern.startsWith('!')) continue;
    const star = pattern.indexOf('*');
    if (star === -1) {
      const full = join(root, pattern);
      if (existsSync(full)) dirs.add(full);
      continue;
    }
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
  return [...dirs];
}

/** Every manifest worth reading, starting from `cwd`. */
export function scan(cwd: string): ScannedManifest[] {
  const root = resolve(cwd);
  const found: ScannedManifest[] = [];
  readManifestsIn(root, root, found);
  for (const dir of workspaceDirs(root)) readManifestsIn(dir, root, found);
  return found;
}
