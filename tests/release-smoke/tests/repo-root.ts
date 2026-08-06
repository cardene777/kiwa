import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Where the repository root is, found by looking rather than by counting.
 *
 * These tests run from two places. `pnpm test` compiles them to
 * `.vitest-dist/tests/` first; running `vitest run tests/x.test.ts` by hand
 * reads `tests/` directly. The two are one directory apart, so a fixed
 * `resolve(HERE, '..', '..', '..', '..')` is right for one and points outside
 * the repository for the other.
 *
 * Measured, the tests fail loudly from the wrong root rather than passing on
 * nothing — reading a file that is not there throws. The exception was
 * `tsup-clean-race`, whose probe swallowed the build error and enumerated an
 * empty directory, so it passed having checked nothing. That produced a test
 * which "passed alone and failed in the sweep" and cost two full sweeps to
 * diagnose (#1821): the sweep was the only place it was running at all.
 *
 * `pnpm-workspace.yaml` is the marker because it exists at the repository root
 * and nowhere else in the tree.
 */
export function repoRoot(from: string): string {
  let dir = from;
  for (let up = 0; up < 8; up += 1) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`pnpm-workspace.yaml not found above ${from}`);
}
