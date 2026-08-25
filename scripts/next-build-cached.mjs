#!/usr/bin/env node
/**
 * Run this example's `build`, unless the inputs have not changed since the last
 * one.
 *
 * The `examples/nextjs-*` targets take 532 s of a 1244 s sweep — 52% — and each
 * one runs a full `next build` from its `playwright.config.ts`:
 *
 *     command: 'tsx tests/prepare-env.ts && pnpm build && pnpm start',
 *
 * Measured on `examples/nextjs-bridge`, that build is 15 s of the target's
 * 49.6 s. Nothing about it changes between runs when the inputs did not.
 *
 * ## What counts as an input
 *
 * Three sources, because environment values can affect `next build` through
 * client inlining, static rendering, and `next.config.*`.
 *
 * | source | why it counts | how it is read |
 * |---|---|---|
 * | tracked content | the example, every workspace package, and the lockfile | `computeInputFingerprint` (git) |
 * | env files | `tests/prepare-env.ts` writes contract addresses into `.env.local` and `.context/*.env`, both ignored by git | hashed directly by name |
 * | process environment | `next.config.*` and statically rendered server code can read any key without touching a file | hashed from `process.env` |
 *
 * **The env files are the reason this is not just `compareArtifactInputs`.**
 * They are ignored by git on purpose (they hold addresses from a throwaway
 * chain), so the git-based fingerprint cannot see them, and a stale build with
 * yesterday's addresses would serve happily.
 *
 * Hashing only `NEXT_PUBLIC_*` is not enough: server code can be rendered at
 * build time, and `next.config.*` can read arbitrary environment keys.
 *
 * ## What is deliberately not an input
 *
 * The `dist/` of the workspace packages this example depends on. It is ignored
 * by git, and hashing it would mean rebuilding whenever a package was rebuilt
 * even from identical sources. The package *sources* are inputs instead, which
 * is the same reasoning `scripts/lib/input-fingerprint.mjs` documents for
 * coverage artefacts: the digest describes the content that produced the
 * output, not the output of an intermediate step.
 *
 * ## When anything is unclear, build
 *
 * A missing artefact, an unreadable sidecar, a sidecar from a schema this does
 * not know, or a fingerprint git could not produce all lead to a build. The
 * cost of building unnecessarily is 15 s; the cost of skipping when the inputs
 * moved is a green test run against code that is not there.
 *
 * Usage (from an example directory):
 *   node ../../scripts/next-build-cached.mjs
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { computeInputFingerprint } from './lib/input-fingerprint.mjs';
import { isMainModule } from './lib/is-main-module.mjs';

/** Bump when the sidecar's meaning changes; older ones then lead to a build. */
export const CACHE_SCHEMA_VERSION = 1;

/** Env files Next reads at build time, in the order it loads them. */
export const ENV_FILE_NAMES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.production.local',
  '.env.development',
  '.env.development.local',
];

/**
 * The env files an example actually has, both the ones Next loads by name and
 * the ones `tests/prepare-env.ts` writes under `.context/`.
 *
 * Returns paths relative to the example, sorted, so the digest does not depend
 * on how the directory happens to be ordered.
 */
export function envFilesFor(exampleDir, io = {}) {
  const exists = io.existsSync ?? existsSync;
  const readdir = io.readdirSync ?? readdirSync;
  const found = ENV_FILE_NAMES.filter((name) => exists(join(exampleDir, name)));

  const contextDir = join(exampleDir, '.context');
  if (exists(contextDir)) {
    let entries = [];
    try {
      entries = readdir(contextDir);
    } catch {
      // Unreadable is not empty. Returning null makes the caller build.
      return null;
    }
    for (const name of entries) {
      if (name.endsWith('.env')) found.push(join('.context', name));
    }
  }
  return found.sort();
}

/**
 * A digest of every build input this example has that git cannot describe.
 *
 * Returns `null` when a listed file cannot be read: that is "the inputs are
 * unknown", which has to lead to a build rather than to a match.
 */
export function untrackedInputDigest(exampleDir, env, io = {}) {
  const read = io.readFileSync ?? readFileSync;
  const files = envFilesFor(exampleDir, io);
  if (files === null) return null;

  const hash = createHash('sha256');
  hash.update(`v${CACHE_SCHEMA_VERSION}\n`);
  for (const rel of files) {
    let body;
    try {
      body = read(join(exampleDir, rel));
    } catch {
      return null;
    }
    hash.update('file\0').update(rel).update('\0').update(body).update('\n');
  }

  // Client inlining is only one route from the environment into a build.
  // Static rendering and `next.config.*` can read arbitrary keys, so omitting
  // the rest can pair a build with environment values it was not made from.
  for (const key of Object.keys(env).sort()) {
    hash.update('env\0').update(key).update('\0').update(String(env[key])).update('\n');
  }
  return hash.digest('hex');
}

/** The whole input digest, or `null` when any part of it is unknown. */
export function inputDigest({ repoRoot, exampleDir, env }, io = {}) {
  const exampleRel = relative(repoRoot, exampleDir);
  const tracked = computeInputFingerprint(
    { repoRoot, inputRels: [exampleRel, 'packages', 'pnpm-lock.yaml'] },
    io,
  );
  if (tracked === null) return null;
  const untracked = untrackedInputDigest(exampleDir, env, io);
  if (untracked === null) return null;
  return createHash('sha256').update(tracked).update('\0').update(untracked).digest('hex');
}

/**
 * Whether the build beside `exampleDir` can be reused.
 *
 * @returns {{ reuse: boolean, reason: string }} — `reason` is printed either
 * way, so a skipped build is never silent.
 */
export function decide({ repoRoot, exampleDir, env }, io = {}) {
  const exists = io.existsSync ?? existsSync;
  const read = io.readFileSync ?? readFileSync;

  if (!exists(join(exampleDir, '.next', 'BUILD_ID'))) {
    return { reuse: false, reason: 'no previous build' };
  }

  const sidecar = join(exampleDir, '.next', 'inputs.sha');
  if (!exists(sidecar)) return { reuse: false, reason: 'the previous build recorded no inputs' };

  let recorded;
  try {
    recorded = JSON.parse(read(sidecar, 'utf-8'));
  } catch {
    return { reuse: false, reason: 'the recorded inputs could not be read' };
  }
  if (recorded?.version !== CACHE_SCHEMA_VERSION) {
    return { reuse: false, reason: `the recorded inputs use schema ${recorded?.version ?? 'none'}` };
  }

  const current = inputDigest({ repoRoot, exampleDir, env }, io);
  if (current === null) return { reuse: false, reason: 'the inputs could not be described' };
  return current === recorded.digest
    ? { reuse: true, reason: 'inputs unchanged since the last build' }
    : { reuse: false, reason: 'inputs changed since the last build' };
}

/** Where the repository root is, found by looking rather than by counting. */
export function repoRootFrom(start) {
  let dir = start;
  for (let up = 0; up < 8; up += 1) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`pnpm-workspace.yaml not found above ${start}`);
}

async function main() {
  const exampleDir = process.cwd();
  const repoRoot = repoRootFrom(exampleDir);
  const { reuse, reason } = decide({ repoRoot, exampleDir, env: process.env });

  if (reuse) {
    process.stdout.write(`[next-build-cached] reusing .next (${reason})\n`);
    return;
  }

  process.stdout.write(`[next-build-cached] building (${reason})\n`);
  const beforeBuild = inputDigest({ repoRoot, exampleDir, env: process.env });
  const sidecar = join(exampleDir, '.next', 'inputs.sha');

  // The old record describes the old artefact. Remove it before touching
  // `.next`, so a failed or unrecordable rebuild cannot later reuse a partial
  // build when the inputs happen to return to the old digest.
  rmSync(sidecar, { force: true });
  const built = spawnSync('pnpm', ['build'], { cwd: exampleDir, stdio: 'inherit' });
  if (built.status !== 0) process.exit(built.status ?? 1);

  // Record only a stable pair. A post-build digest alone can describe an edit
  // made while Next was compiling, even though the output may contain the
  // earlier content.
  const afterBuild = inputDigest({ repoRoot, exampleDir, env: process.env });
  if (beforeBuild === null || afterBuild === null) {
    process.stdout.write('[next-build-cached] built, but the inputs could not be recorded\n');
    return;
  }
  if (beforeBuild !== afterBuild) {
    process.stdout.write('[next-build-cached] built, but the inputs changed during the build\n');
    return;
  }
  writeFileSync(
    sidecar,
    `${JSON.stringify({ version: CACHE_SCHEMA_VERSION, digest: afterBuild }, null, 2)}\n`,
  );
}

// Only run as CLI when invoked directly (not when imported by tests).
const isEntry = isMainModule(process.argv[1], import.meta.url);
if (isEntry) {
  main().catch((err) => {
    process.stderr.write(`[next-build-cached] ${err.stack ?? err.message ?? err}\n`);
    process.exit(1);
  });
}
