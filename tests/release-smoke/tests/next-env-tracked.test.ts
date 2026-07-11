// Next.js writes `next-env.d.ts` on `next build` and `next dev`. The file's
// contents do not change between runs unless the Next.js version does — every
// tracked copy in this repo is the same five lines. But if the file is not
// tracked, `pnpm test:all` sees it appear from nowhere and reports a dirty
// tree. This is what #1397 hit: sixteen examples had it tracked, two did not,
// and the two showed up as `dirty` on every sweep.
//
// The decision (2026-07-11 in the vault) was to track it in every Next.js
// example. Next.js's own `create-next-app` gitignore does not exclude
// `next-env.d.ts`, so this is the default convention rather than a departure.
//
// When this test fails, a Next.js example is missing its `next-env.d.ts`
// under `git ls-files`. Two ways to fix:
//   1. Run `next build` or `next dev` once, then `git add
//      examples/<name>/next-env.d.ts`.
//   2. If the example is intentionally not a Next.js example, remove its
//      `next.config.*` — then this test stops finding it.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// Four levels: `tests/release-smoke/.vitest-dist/tests/` → repo root.
const ROOT = resolve(HERE, '..', '..', '..', '..');

/** Paths git is tracking under the given pathspec. Empty when none match. */
function trackedUnder(pathspec: string): string[] {
  const out = execFileSync('git', ['ls-files', '--', pathspec], {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 8 * 1024 * 1024,
  });
  return out.split('\n').filter((line) => line.length > 0);
}

/** Every `examples/<name>` that has a `next.config.*`. */
function nextExamples(): string[] {
  const configs = [
    ...trackedUnder('examples/*/next.config.mjs'),
    ...trackedUnder('examples/*/next.config.js'),
    ...trackedUnder('examples/*/next.config.ts'),
    ...trackedUnder('examples/*/next.config.cjs'),
  ];
  const uniq = new Set(configs.map((path) => dirname(path)));
  return [...uniq].sort();
}

describe('every Next.js example commits next-env.d.ts', () => {
  it('no Next.js example is missing next-env.d.ts under git', () => {
    const examples = nextExamples();
    const missing = examples.filter((dir) => trackedUnder(`${dir}/next-env.d.ts`).length === 0);
    expect(missing).toEqual([]);
  });

  it('the checker is looking at every Next.js example, not none of them', () => {
    // Without this, a walk that finds zero examples passes the invariant above
    // vacuously. As long as the repo has at least one `next.config.*`, we
    // expect at least one example here.
    const examples = nextExamples();
    expect(examples.length).toBeGreaterThan(0);
  });

  it('the tracker can say no: an example without next-env.d.ts is detected as such', () => {
    // A negative-case check that the tracked-under lookup can return empty.
    // A directory with no `next-env.d.ts` under it — the repo root — should
    // return no matches when queried directly.
    expect(trackedUnder('next-env.d.ts')).toEqual([]);
    // And a name a Next.js example does have, so the tracker can also say yes.
    const examples = nextExamples();
    const one = examples[0];
    if (one !== undefined) {
      expect(trackedUnder(`${one}/next-env.d.ts`).length).toBeGreaterThan(0);
    }
  });

  it('every tracked next-env.d.ts under a Next.js example has the Next.js reference triple-slashes', () => {
    // The file's contents are fixed by Next.js: two triple-slash references
    // and a "do not edit" note. If one drifts, it means someone edited it by
    // hand — and Next.js will rewrite it on the next build anyway.
    const examples = nextExamples();
    for (const dir of examples) {
      const path = `${dir}/next-env.d.ts`;
      const tracked = trackedUnder(path);
      if (tracked.length === 0) continue; // covered by the missing check above
      // Read the working tree copy, not HEAD — this test also runs against
      // staged-but-not-yet-committed additions.
      const out = readFileSync(resolve(ROOT, path), 'utf-8');
      // Reference name is stable across Next.js 13/14/15.
      expect(out, `${basename(dir)}: ${path}`).toContain('/// <reference types="next" />');
    }
  });
});
