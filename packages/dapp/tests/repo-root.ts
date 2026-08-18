import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Where the repository root is, found by looking rather than by counting.
 *
 * Two tests here read fixtures that live at the repository root
 * (`examples/nextjs-bridge`, `examples/nextjs-aa-smart-account`). Both used to
 * reach them with `resolve(process.cwd(), '../..')`, which is right under
 * `pnpm test` and wrong under Stryker: the mutation runner works from
 * `.stryker-tmp/sandbox-*`, so the same expression pointed at
 * `packages/dapp/examples/` and the artefact read threw ENOENT. #1982 traced
 * `dapp`'s 85 % no-coverage partly to that failure.
 *
 * Counting directories cannot work for both, since the two roots are three
 * levels apart. Walking up to a marker works from either.
 *
 * `@kiwa-lab/perf-harness` exports `resolveKiwaRepoRoot`, which does the same
 * search, but it resolves through `dist/` and so requires that package to be
 * built first. Its own tests arrange that with a `pretest:perf` hook; the unit
 * suite has no such step, so importing it here would make `pnpm -F @kiwa-lab/dapp
 * run test` depend on build order on a clean checkout.
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
