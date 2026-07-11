// A playwright config that points `testDir` at a directory that does not exist
// bails at run time with `Error: No tests found`. `pnpm -r test` used to hide
// these behind the first failing package; #1396 removed five of them, and this
// test keeps them from coming back.
//
// The five that were removed:
//   examples/basic-connect
//   examples/defi-swap
//   examples/mint-nft
//   examples/nextjs-token-gating
//   examples/nft-marketplace
//
// The fix in every case was one of:
//   1. Delete the stale `playwright.config.ts` — the specs live under
//      `tests/fixtures/<name>/e2e-test/` with the fixture's own config, driven
//      by the fixture's `test:e2e` script, not the example's `test`.
//   2. Point `testDir` at a directory that does exist, and add the specs.
//
// When this test fails, the config's `testDir` names a path that is not on
// disk. `git ls-files <dir>` will be empty. Choose (1) or (2).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// Four levels: `tests/release-smoke/.vitest-dist/tests/` → repo root.
const ROOT = resolve(HERE, '..', '..', '..', '..');

/** Every playwright config git is tracking under the given pathspec. */
function trackedConfigs(pathspec: string): string[] {
  const out = execFileSync('git', ['ls-files', '--', pathspec], {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 8 * 1024 * 1024,
  });
  return out.split('\n').filter((line) => line.length > 0);
}

/** The `testDir` value from a playwright config, or `null` if none is set. */
function readTestDir(configPath: string): string | null {
  const source = readFileSync(resolve(ROOT, configPath), 'utf-8');
  // playwright configs in this repo write `testDir: './e2e-test'` on one line.
  // A parser would be sturdier but would also read a lot of TS; the regex is
  // the smallest thing that catches the shapes actually in the tree.
  const match = source.match(/testDir\s*:\s*['"`]([^'"`]+)['"`]/);
  return match ? (match[1] as string) : null;
}

describe('every playwright config points testDir at a directory that exists', () => {
  it('no example config names a testDir that is not on disk', () => {
    const configs = trackedConfigs('examples/**/playwright.config.ts');
    const missing: string[] = [];
    for (const config of configs) {
      const testDir = readTestDir(config);
      if (testDir === null) continue;
      const absolute = resolve(ROOT, dirname(config), testDir);
      if (!existsSync(absolute)) {
        missing.push(`${config} → ${testDir}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('no fixture config names a testDir that is not on disk', () => {
    const configs = trackedConfigs('tests/fixtures/**/playwright.config.ts');
    const missing: string[] = [];
    for (const config of configs) {
      const testDir = readTestDir(config);
      if (testDir === null) continue;
      const absolute = resolve(ROOT, dirname(config), testDir);
      if (!existsSync(absolute)) {
        missing.push(`${config} → ${testDir}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('the checker can say no: a config that points at a nonexistent dir is reported', () => {
    // Without this, the first two tests pass against a `readTestDir` that
    // always returns null and a walk that finds no configs. The two invariants
    // here fail if either goes silent.
    const configs = trackedConfigs('examples/**/playwright.config.ts');
    expect(configs.length).toBeGreaterThan(0);
    // At least one real config is parseable — the parser has to work.
    let parsedAtLeastOne = false;
    for (const config of configs) {
      if (readTestDir(config) !== null) {
        parsedAtLeastOne = true;
        break;
      }
    }
    expect(parsedAtLeastOne).toBe(true);
  });
});
