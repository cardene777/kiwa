// A test that writes into the repository is a test with a side effect.
//
// Every dogfood example's `pnpm test` runs an `emit-fidelity-report` spec that
// writes `quality-report/fidelity-latest.{json,md}` next to the example, with a
// fresh `reportedAt` on every run — and, in ten of them, a fresh `p50Ms` /
// `p95Ms` / `p99Ms`, because those are measured wall-clock latencies. The docs
// have always described that path as git-ignored, and 27 examples ignored it in
// their own `.gitignore`. The other 34 committed it. So a full test run left 56
// modified files in the working tree, and a `git add -A` afterwards swept them
// into an unrelated commit — which is exactly how they got into the first
// commit of #1389.
//
// The snapshot a release depends on is not this file. It is promoted by hand to
// `docs/quality-reports/<domain>/<name>.md`, which stays tracked and reviewed.
// Nothing in the repository reads the per-example copy; the assertions that
// matter run inside the emit spec itself, against the in-memory report.
//
// When this test fails, the fix is one of:
//   1. Do not commit the generated report. `git rm --cached <path>` — the root
//      `.gitignore` already ignores `examples/*/quality-report/`, so a tracked
//      file there was force-added or predates the rule.
//   2. If a generated report must be reviewed, promote it to
//      `docs/quality-reports/<domain>/<name>.md` and commit it there.
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
// This file runs from `tests/release-smoke/.vitest-dist/tests/`, not from its source
// directory. Four levels, not three: with three, `git ls-files` runs inside `tests/`,
// where the `examples/*` pathspec matches nothing and the first test below passes
// while checking nothing at all.
const ROOT = repoRoot(HERE);
/** Paths git is tracking under the given pathspec. Empty when none match. */
function trackedUnder(pathspec: string): string[] {
  const out = execFileSync('git', ['ls-files', '--', pathspec], {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 8 * 1024 * 1024,
  });
  return out.split('\n').filter((line) => line.length > 0);
}

/** Whether git would ignore `path`, asking git rather than reparsing `.gitignore`. */
function isIgnored(path: string): boolean {
  try {
    execFileSync('git', ['check-ignore', '-q', '--', path], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('generated fidelity reports are not committed', () => {
  it('no example has a tracked quality-report/', () => {
    expect(trackedUnder('examples/*/quality-report/*')).toEqual([]);
  });

  it('git ignores the path an example writes to, whether or not the example exists yet', () => {
    expect(isIgnored('examples/dogfood-alert-orchestrator/quality-report/fidelity-latest.json')).toBe(true);
    expect(isIgnored('examples/a-package-nobody-has-written-yet/quality-report/fidelity-latest.md')).toBe(true);
  });

  it('the checker can say no: a tracked path is reported as tracked', () => {
    // Without this, the first test passes against a `trackedUnder` that always
    // returns []. `package.json` is tracked in every checkout of this repo.
    expect(trackedUnder('package.json')).toEqual(['package.json']);
  });

  it('the ignore checker can say no: a tracked path is not ignored', () => {
    expect(isIgnored('package.json')).toBe(false);
  });

  it('the reviewed snapshots stay tracked', () => {
    // Ignoring the generated copy must not take the promoted ones with it.
    const promoted = trackedUnder('docs/quality-reports/**/*.md');
    expect(promoted.length).toBeGreaterThan(50);
    expect(isIgnored(promoted[0] as string)).toBe(false);
  });
});
