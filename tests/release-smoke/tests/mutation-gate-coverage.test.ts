// A package that runs mutation testing must also be scored (Issue #1951).
//
// `packages/security` carried a Stryker config, a threshold in its header
// comment, and 9 files in `mutate` — and nothing read the result. It was absent
// from `PACKAGE_TIER` (so the gate had no threshold for it), absent from
// `PKG_DIRS` (so the gate could not find its report), and absent from root
// `test:mutation` (so the run never happened). The config read like coverage
// and delivered none.
//
// The neighbouring a11y gate has had a check since #1785
// (`scripts/check-a11y-gates.test.mjs`), comparing its tier map against the root
// filter list. That shape would still have passed here, because it only compares
// two hand-maintained lists to each other and `security` was missing from both.
// What gave it away was the package itself, so this axis starts from the package
// and asks whether the wiring exists.
//
// When it fails, the fix is one of:
//   1. add the package to `PACKAGE_TIER` / `PKG_DIRS` / root `test:mutation`
//   2. remove its `test:mutation` script and Stryker config if it should not run
//   3. add it to `UNSCORED_ALLOWLIST` below with the reason
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const GATE = resolve(REPO_ROOT, 'scripts/check-mutation-gates.mjs');
const DOC = resolve(REPO_ROOT, 'docs/quality/mutation-thresholds.md');

// Workspace-relative directories that run mutation testing on purpose without
// being scored (`packages/foo`, not `foo`). Each entry needs a reason: an
// unexplained exemption is the state this axis exists to detect.
// `withoutExemptions` below is what applies it, and it is tested.
/**
 * Packages whose `mutate` covers every implementation file.
 *
 * `hono` was there from the start; `cli` widened in #1961 and the small group in
 * #1963. The list only grows — a package that reached 100% and then dropped a
 * file is the drift #1936 cost 611 unseen mutants for.
 */
const FULLY_WIDENED: readonly string[] = [
  'a11y',
  'api',
  'cli',
  'cli-test',
  'component',
  'core',
  'data',
  'e2e',
  'hono',
  'nextjs',
  'ui',
];

const UNSCORED_ALLOWLIST: readonly string[] = [
  // (empty — every package that runs mutation testing is scored by the gate)
];

/**
 * A Stryker config, by shape rather than by name.
 *
 * Keying on `stryker.config.mjs` alone would let a package rename its config to
 * another supported name and drop out of this axis while still running — the
 * same invisibility the axis exists to catch. Listing the supported names
 * instead just moves the problem: Stryker resolves four extensions across two
 * stems today, `.cjs` was missing from the first version of this list, and a
 * list of forms has no point at which it is provably complete (the lesson
 * `docs/quality/mutation-thresholds.md § Telling the shapes apart` records).
 *
 * So both stems with any extension count. A stray `stryker.conf.md` would make
 * this axis demand wiring for a package that does not run — the safe direction,
 * since the failure it prevents is a package that runs unscored.
 */
const STRYKER_CONFIG_PATTERN = /^\.?stryker\.(config|conf)\.[a-z0-9]+$/i;

interface TierEntry {
  tier: string;
  override?: number;
  reason?: string;
}

interface Runner {
  dir: string;
  scoped: string;
  configs: string[];
  hasScript: boolean;
  script: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadGate = (): Promise<any> => import(pathToFileURL(GATE).href);

export function withoutExemptions(names: string[], allowlist: readonly string[]): string[] {
  return names.filter((name) => !allowlist.includes(name));
}

/**
 * Every workspace package, from the globs `pnpm-workspace.yaml` declares.
 *
 * Scanning `packages/*` alone would miss the other five entries the workspace
 * lists (`examples/*`, `tests/fixtures/*`, `tests/release-smoke`, `promo`,
 * and one nested path). A mutation run set up under any of them is a run the
 * gate does not score, which is the failure this axis exists to catch — and the
 * narrower scan would report success while never having looked.
 */
export function workspaceGlobs(yaml: string): string[] {
  const lines = yaml.split('\n');
  const start = lines.findIndex((line) => /^packages:\s*$/.test(line));
  if (start === -1) return [];
  const globs: string[] = [];
  for (const line of lines.slice(start + 1)) {
    // A non-indented line starts the next top-level key. `onlyBuiltDependencies`
    // is also a list of bare words, and reading it as paths would add packages
    // that do not exist.
    if (/^\S/.test(line)) break;
    const match = /^\s*-\s*["']?([^"'#\s]+)["']?\s*$/.exec(line);
    if (match) globs.push(match[1] as string);
  }
  return globs;
}

function workspacePackageDirs(): string[] {
  const yaml = readFileSync(resolve(REPO_ROOT, 'pnpm-workspace.yaml'), 'utf-8');
  const dirs: string[] = [];
  for (const glob of workspaceGlobs(yaml)) {
    if (!glob.endsWith('/*')) {
      if (existsSync(resolve(REPO_ROOT, glob, 'package.json'))) dirs.push(glob);
      continue;
    }
    const parent = glob.slice(0, -2);
    const parentPath = resolve(REPO_ROOT, parent);
    if (!existsSync(parentPath)) continue;
    for (const entry of readdirSync(parentPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (existsSync(resolve(parentPath, entry.name, 'package.json'))) {
        dirs.push(`${parent}/${entry.name}`);
      }
    }
  }
  return [...new Set(dirs)].sort();
}

/**
 * Workspace packages that run mutation testing.
 *
 * The script is the fact: `pnpm -F <pkg> run test:mutation` is what the root
 * sweep invokes, and a package without it does not run whatever config it
 * carries. A Stryker config counts too, because a config with no script is
 * wiring someone meant to run and the gate should say so either way.
 */
function mutationRunners(): Runner[] {
  const runners: Runner[] = [];
  for (const dir of workspacePackageDirs()) {
    const dirPath = resolve(REPO_ROOT, dir);
    const manifest = JSON.parse(readFileSync(resolve(dirPath, 'package.json'), 'utf-8')) as {
      name?: string;
      scripts?: Record<string, string>;
    };
    const script = manifest.scripts?.['test:mutation'] ?? '';
    const hasScript = script !== '';
    const configs = readdirSync(dirPath, { withFileTypes: true })
      .filter((child) => !child.isDirectory() && STRYKER_CONFIG_PATTERN.test(child.name))
      .map((child) => child.name)
      .sort();
    if (configs.length === 0 && !hasScript) continue;
    runners.push({ dir, scoped: manifest.name ?? dir, configs, hasScript, script });
  }
  return runners.sort((a, b) => a.dir.localeCompare(b.dir));
}

/**
 * The one invocation root `test:mutation` is allowed to be.
 *
 * It no longer holds a list. `scripts/run-mutation.mjs` derives the packages
 * from `PACKAGE_TIER`, so "what runs" and "what is scored" are one object and
 * cannot disagree.
 *
 * The previous shape — a hand-written `-F @kiwa-lab/…` list in the root script —
 * needed this file to parse a shell string to check the two agreed, and five
 * review rounds each found another form that parser read wrongly (spellings,
 * `=` versus space, quoting, scope, exclusions). Removing the second copy
 * removed the parser with it.
 */
export const DRIVER_INVOCATION = 'node scripts/run-mutation.mjs';

/**
 * The one invocation a package's `test:mutation` is allowed to be.
 *
 * A bare `stryker run` scores whatever is in the gitignored `.vitest-dist`:
 * nothing on a clean checkout, stale JavaScript in a workspace with an old
 * build. 20 packages were in that shape (#1955). `package-mutation.mjs` removes,
 * compiles, then runs, and requiring the exact string keeps a package from
 * going back to calling Stryker directly.
 */
export const PACKAGE_INVOCATION = 'node ../../scripts/package-mutation.mjs';

export function runsThroughDriver(script: string): boolean {
  // Equality, not a pattern. Round 6 replaced a substring test with a prefix
  // pattern, and Round 7 found the next form it let through
  // (`node scripts/run-mutation.mjs || true`, which runs the driver and throws
  // its exit code away). Every partial match leaves another suffix to find;
  // equality leaves none, and the cost is that changing the invocation means
  // changing this constant with it.
  return script.trim() === DRIVER_INVOCATION;
}

function rootRunsThroughDriver(): boolean {
  const root = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf-8')) as {
    scripts: Record<string, string>;
  };
  return runsThroughDriver(root.scripts['test:mutation'] ?? '');
}

/**
 * The tier table from the doc, which owns these numbers.
 *
 * Copying the break column into this file would let the doc move without the
 * check noticing, which is the drift `§ Overrides` already warns about between
 * the doc and the gate.
 *
 * Tier labels are read, not listed: naming the four current tiers here would
 * silently skip a fifth, and the rows are already distinctive (three percentage
 * columns).
 */
function docTierTable(): Record<string, { high: number; low: number; break: number }> {
  const text = readFileSync(DOC, 'utf-8');
  const rows = [...text.matchAll(/^\|\s*([A-Za-z][\w -]*?)\s*\|\s*(\d+) %\s*\|\s*(\d+) %\s*\|\s*(\d+) %\s*\|/gm)];
  const table: Record<string, { high: number; low: number; break: number }> = {};
  for (const [, label, high, low, brk] of rows) {
    const key = String(label).toLowerCase().replace(/\s+/g, '-');
    table[key] = { high: Number(high), low: Number(low), break: Number(brk) };
  }
  return table;
}

describe('every package that runs mutation testing is scored', () => {
  it('gives each runner a tier, a directory, and a place in the run', async () => {
    const { PACKAGE_TIER, PKG_DIRS } = await loadGate();
    const runners = mutationRunners();
    const expected = withoutExemptions(
      runners.map((runner) => runner.dir),
      UNSCORED_ALLOWLIST,
    );

    expect(expected.length).toBeGreaterThan(0);
    for (const runner of runners.filter((r) => expected.includes(r.dir))) {
      const { scoped, dir } = runner;
      expect(PACKAGE_TIER[scoped], `${scoped}: no PACKAGE_TIER entry`).toBeDefined();
      expect(PKG_DIRS[scoped], `${scoped}: no PKG_DIRS entry`).toBe(dir);
      // A tier entry puts the package in the run (the driver derives the list
      // from that table), so what is left to check is that the package owns the
      // script the driver invokes. Without it pnpm skips the package silently
      // and the gate reads whatever report the last run left behind.
      expect(runner.hasScript, `${scoped}: no test:mutation script to run`).toBe(true);
      // And that the script builds before it scores (#1955).
      expect(runner.script.trim(), `${scoped}: test:mutation is not the shared runner`).toBe(
        PACKAGE_INVOCATION,
      );
    }
  });

  it('drops a package named in the allowlist and keeps the rest', () => {
    // The escape hatch is empty today, so the branch that applies it would never
    // run against the real tree. Exercising it here keeps it from rotting into a
    // hole nobody notices (the same gap #1948 found in its own missing-target
    // report).
    const dirs = ['packages/core', 'packages/security'];
    expect(withoutExemptions(dirs, ['packages/security'])).toEqual(['packages/core']);
    expect(withoutExemptions(dirs, [])).toEqual(dirs);
  });

  it('reads the workspace globs rather than assuming packages/*', () => {
    // `packages/*` is one of six entries. Reading only that one would let a
    // mutation run under `examples/*` sit unscored while this axis reports
    // success, which is the failure it exists to catch.
    const globs = workspaceGlobs(readFileSync(resolve(REPO_ROOT, 'pnpm-workspace.yaml'), 'utf-8'));
    expect(globs).toContain('packages/*');
    expect(globs).toContain('examples/*');
    expect(globs.length).toBeGreaterThan(1);
    // The list stops at the next top-level key: `onlyBuiltDependencies` is also
    // a list, and its entries are package names that resolve to nothing.
    expect(globs).not.toContain('better-sqlite3');
  });

  it('stops parsing globs at the end of the packages block', () => {
    const yaml = ['packages:', '  - "packages/*"', '  - promo', 'onlyBuiltDependencies:', '  - better-sqlite3', ''].join(
      '\n',
    );
    expect(workspaceGlobs(yaml)).toEqual(['packages/*', 'promo']);
    expect(workspaceGlobs('minimumReleaseAge: 4320\n')).toEqual([]);
  });

  it('does not score a package that runs nothing to score', async () => {
    const { PACKAGE_TIER } = await loadGate();
    // The reverse direction. A tier entry with no runner means the gate waits for
    // a report nothing produces, which reads as a failure of the package rather
    // than of the wiring.
    const runners = new Set(mutationRunners().map((runner) => runner.scoped));
    for (const scoped of Object.keys(PACKAGE_TIER)) {
      expect(runners.has(scoped), `${scoped}: PACKAGE_TIER entry runs no mutation testing`).toBe(
        true,
      );
    }
  });

  it('runs exactly the packages it scores', async () => {
    // By construction now: the driver builds its pnpm filters from the same
    // table the gate scores against. What can still break is the root script
    // being pointed somewhere else, or the driver being handed a different
    // source of names.
    expect(rootRunsThroughDriver(), 'root test:mutation no longer calls the driver').toBe(true);

    const { PACKAGE_TIER } = await loadGate();
    const driver = await import(pathToFileURL(resolve(REPO_ROOT, 'scripts/run-mutation.mjs')).href);
    expect(driver.selectPackages([]).sort()).toEqual(Object.keys(PACKAGE_TIER).sort());
    expect(driver.pnpmArgs(['@kiwa-lab/core'])).toEqual([
      '-F',
      '@kiwa-lab/core',
      '--no-bail',
      'run',
      'test:mutation',
    ]);
  });

  it('builds before it scores, in every package', async () => {
    // The failure this replaces: a bare `stryker run` scores the gitignored
    // `.vitest-dist`, which is absent on a clean checkout and stale in a
    // workspace with an old build. Checked per package rather than by reading
    // the shared runner, since the runner only helps the packages that call it.
    const runners = mutationRunners();
    expect(runners.length).toBeGreaterThan(0);
    for (const runner of runners) {
      expect(runner.script.trim(), `${runner.scoped}: does not use the shared runner`).toBe(
        PACKAGE_INVOCATION,
      );
    }
    expect(
      existsSync(resolve(REPO_ROOT, 'scripts/package-mutation.mjs')),
      'scripts/package-mutation.mjs is missing',
    ).toBe(true);
  });

  it('removes, compiles, then runs — and stops if the compile fails', async () => {
    const runner = await import(
      pathToFileURL(resolve(REPO_ROOT, 'scripts/package-mutation.mjs')).href
    );
    const steps: string[] = [];
    const label = (dir: string) => dir.replace('/pkg/', '');
    const rm = (dir: string) => steps.push(`rm ${label(dir)}`);

    const green = runner.runPackageMutation({
      cwd: '/pkg',
      rm,
      run: (command: string, args: string[]) => {
        steps.push(`${command} ${args.join(' ')}`);
        return 0;
      },
    });
    // Order is the point: scoring a build that was not just produced from this
    // source is the failure being prevented. The report goes too — the gate
    // reads `mutation-report/mutation.json`, so a run that stops early must not
    // leave the previous one behind.
    expect(steps).toEqual([
      'rm .vitest-dist',
      'rm mutation-report',
      'tsc -p tsconfig.vitest.json',
      'stryker run',
    ]);
    expect(green).toBe(0);

    // Stryker is invoked with `run` and nothing else, whatever is on the command
    // line. Forwarding would let one invocation narrow its own scope
    // (`--mutate`) or redirect its report while the gate reads the result as if
    // it covered the package.
    const argv = process.argv;
    process.argv = [...argv.slice(0, 2), '--mutate', 'src/only-this.js'];
    steps.length = 0;
    try {
      runner.runPackageMutation({
        cwd: '/pkg',
        rm,
        run: (command: string, args: string[]) => {
          steps.push(`${command} ${args.join(' ')}`);
          return 0;
        },
      });
    } finally {
      process.argv = argv;
    }
    expect(steps.at(-1)).toBe('stryker run');

    // A missing config cannot produce a report now, so the previous one has to
    // go — otherwise the gate scores a run that did not happen.
    steps.length = 0;
    const unconfigured = runner.runPackageMutation({
      cwd: '/pkg',
      rm,
      run: (command: string) => {
        steps.push(command);
        return 0;
      },
      setupProblems: () => ['no Stryker config'],
    });
    expect(steps).toEqual(['rm .vitest-dist', 'rm mutation-report']);
    expect(unconfigured).toBe(2);

    // The one case where deleting is the wrong move: this is not a package.
    steps.length = 0;
    const elsewhere = runner.runPackageMutation({
      cwd: '/not-a-package',
      rm,
      run: (command: string) => {
        steps.push(command);
        return 0;
      },
      dirProblem: 'no package.json',
    });
    expect(steps).toEqual([]);
    expect(elsewhere).toBe(2);

    steps.length = 0;
    const red = runner.runPackageMutation({
      cwd: '/pkg',
      rm,
      run: (command: string) => {
        steps.push(command);
        return command === 'tsc' ? 2 : 0;
      },
    });
    // A failed compile leaves the build directory empty or partial. Running
    // Stryker anyway is how a green report gets written for code that is not
    // there; stopping with the report already removed is how the gate finds out.
    expect(steps).toEqual(['rm .vitest-dist', 'rm mutation-report', 'tsc']);
    expect(red).toBe(2);
  });

  it('accepts the driver invocation and nothing else', () => {
    expect(runsThroughDriver(DRIVER_INVOCATION)).toBe(true);
    expect(runsThroughDriver(` ${DRIVER_INVOCATION} `)).toBe(true);
    // Mentioning the path is not running it.
    expect(runsThroughDriver('echo scripts/run-mutation.mjs')).toBe(false);
    expect(runsThroughDriver('pnpm run x # scripts/run-mutation.mjs')).toBe(false);
    expect(runsThroughDriver('node scripts/run-mutation.mjs.bak')).toBe(false);
    // Running it and discarding the result is not running the gate's run.
    expect(runsThroughDriver('node scripts/run-mutation.mjs || true')).toBe(false);
    expect(runsThroughDriver('node scripts/run-mutation.mjs > /dev/null 2>&1')).toBe(false);
    expect(runsThroughDriver('')).toBe(false);
  });

  it('refuses a package the gate does not score', async () => {
    const driver = await import(pathToFileURL(resolve(REPO_ROOT, 'scripts/run-mutation.mjs')).href);
    // The subset form is for running one package by hand. Accepting an unknown
    // name would run something the gate then has no threshold for.
    expect(() => driver.selectPackages(['nope'])).toThrow(/not scored/);
    expect(driver.selectPackages(['security'])).toEqual(['@kiwa-lab/security']);
  });

  it('keeps a widened package widened', async () => {
    // A package that reached every implementation file must not quietly shrink.
    // Nothing else notices: dropping an entry from `mutate` leaves the gate
    // green because the remaining files still score well, which is #1936 in a
    // new shape. Adding a name here is the deliberate act of widening one.
    const { reportForPackage } = await import(
      pathToFileURL(resolve(REPO_ROOT, 'scripts/mutation-scope-report.mjs')).href
    );
    for (const pkg of FULLY_WIDENED) {
      const report = await reportForPackage(pkg);
      expect(report, `${pkg}: no report`).not.toBeNull();
      expect(
        report.uncovered.map((row: { file: string }) => row.file),
        `${pkg}: implementation files dropped out of \`mutate\``,
      ).toEqual([]);
    }
  });

  it('carries no override that raises a tier bar', async () => {
    const { PACKAGE_TIER, TIER_THRESHOLD } = await loadGate();
    // #1963 removed the last two (api 90, a11y 90). A raised override is a
    // number from a narrow scope, and the doc's rule is that it returns to the
    // tier default as the scope grows — so a new one appearing means either the
    // rule changed or someone pinned a number the widened scope cannot hold.
    for (const [scoped, entry] of Object.entries(PACKAGE_TIER as Record<string, TierEntry>)) {
      if (entry.override === undefined) continue;
      expect(
        entry.override,
        `${scoped}: override raises the ${entry.tier} bar (docs § Overrides)`,
      ).toBeLessThan(TIER_THRESHOLD[entry.tier] as number);
    }
  });

  it('gives every entry a tier the threshold table knows', async () => {
    const { PACKAGE_TIER, TIER_THRESHOLD, thresholdFor } = await loadGate();
    const tiers = Object.keys(docTierTable());
    // Not a fixed count: a fifth tier is a doc edit, not a regression. An empty
    // table means the parse broke, and every entry below is checked against it.
    expect(tiers.length, 'doc tier table did not parse').toBeGreaterThan(0);
    for (const [scoped, entry] of Object.entries(PACKAGE_TIER as Record<string, TierEntry>)) {
      expect(tiers, `${scoped}: unknown tier ${entry.tier}`).toContain(entry.tier);
      expect(typeof thresholdFor(scoped), `${scoped}: no effective threshold`).toBe('number');
      if (entry.override !== undefined && entry.override < (TIER_THRESHOLD[entry.tier] as number)) {
        // A looser override is a temporary exception and the reason is what makes
        // it reviewable later (docs/quality/mutation-thresholds.md § Overrides).
        expect(entry.reason, `${scoped}: looser override without a reason`).toBeTruthy();
      }
    }
  });

  it('reads the same tier defaults the doc publishes', async () => {
    const { TIER_THRESHOLD } = await loadGate();
    const table = docTierTable();
    for (const [tier, row] of Object.entries(table)) {
      expect(TIER_THRESHOLD[tier], `${tier}: gate default vs doc high column`).toBe(row.high);
    }
  });

  it('never lets a config sit below the break bar its tier sets', async () => {
    const { PACKAGE_TIER } = await loadGate();
    const table = docTierTable();
    // Not an equality check against the gate. `§ Overrides` says a config's
    // `high` and the gate's threshold may differ and the gate is authoritative —
    // `auth` declares the Framework default 70 while the gate holds a temporary
    // override at 65, and `a11y` declares 90 against a tier default of 60. Both
    // are intended.
    //
    // What must hold is the floor: a config whose own `break` sits under the
    // tier's fails the local run later than the gate does, so a red package
    // reads green until someone runs the gate.
    for (const runner of mutationRunners()) {
      const entry = (PACKAGE_TIER as Record<string, TierEntry>)[runner.scoped];
      if (!entry) continue;
      const floor = table[entry.tier]?.break;
      expect(floor, `${runner.scoped}: tier ${entry.tier} absent from the doc table`).toBeTypeOf(
        'number',
      );
      for (const configName of runner.configs) {
        const config = readFileSync(resolve(REPO_ROOT, runner.dir, configName), 'utf-8');
        const declared = /thresholds:\s*\{[^}]*\bbreak:\s*(\d+)/.exec(config);
        expect(declared, `${runner.scoped}: no thresholds.break in ${configName}`).not.toBeNull();
        expect(
          Number((declared as RegExpExecArray)[1]),
          `${runner.scoped}: ${configName} break below the ${entry.tier} tier bar`,
        ).toBeGreaterThanOrEqual(floor as number);
      }
    }
  });
});
