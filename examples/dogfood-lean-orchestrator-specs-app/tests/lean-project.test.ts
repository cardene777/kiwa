/**
 * The Lean files are in the repository, and the repository walks the path a
 * consumer walks.
 *
 * `verifyLeanSpec` and `generateLakeProject` were exported, documented, and
 * called from nowhere but their own unit tests. Nothing here had ever built a
 * Lake project or proved a spec through the `verify` path — the two things a
 * consumer does with this package.
 *
 * A generated file that is checked in has one failure mode the generator cannot
 * have: it goes stale. Someone edits `orchestrator-specs.ts`, `lake build` keeps
 * passing, and the `.lean` file on disk proves yesterday's machine. These tests
 * hold the file, the spec and Lean together.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkLeanTable, generateLeanSpec, verifyLeanSpec } from '@kiwa-lab/lean';
import { ROOT_NAMESPACE, SPECS_DIR, renderLeanProject } from '../src/lean-project.js';
import { ALL_SPECS } from '../src/orchestrator-specs.js';

/**
 * The package root, found by looking rather than by counting.
 *
 * This file runs from two places: `tests/` when `test` runs the sources directly (#2206), and
 * `.vitest-dist/tests/` when the taxonomy or coverage routes compile first. The two are one
 * directory apart, so a fixed number of hops is right for one and points at `examples/` for the
 * other — which is where `ENOENT: .../examples/specs/KiwaSpecs` came from.
 *
 * `package.json` is the marker: it exists at the package root and nowhere below it here.
 */
function packageRoot(from: string): string {
  let dir = from;
  for (let up = 0; up < 8; up += 1) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`package.json not found above ${from}`);
}

const PACKAGE_ROOT = packageRoot(dirname(fileURLToPath(import.meta.url)));
const SPECS_ROOT = join(PACKAGE_ROOT, SPECS_DIR);

function toolInstalled(bin: string): boolean {
  try {
    execFileSync(bin, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const HAS_LEAN = toolInstalled('lean');
const HAS_LAKE = toolInstalled('lake');

const read = (rel: string): string => readFileSync(join(SPECS_ROOT, rel), 'utf-8');

describe('the Lake project is in the repository', () => {
  it('T-PROJ-001 lakefile, toolchain and root module are checked in', () => {
    expect(existsSync(join(SPECS_ROOT, 'lakefile.lean'))).toBe(true);
    expect(existsSync(join(SPECS_ROOT, 'lean-toolchain'))).toBe(true);
    expect(existsSync(join(SPECS_ROOT, `${ROOT_NAMESPACE}.lean`))).toBe(true);
  });

  it('T-PROJ-002 every machine has a module, and there are no others', () => {
    const onDisk = readdirSync(join(SPECS_ROOT, ROOT_NAMESPACE)).sort();
    const expected = ALL_SPECS.map((spec) => `${spec.moduleName}.lean`).sort();

    // A machine deleted from `ALL_SPECS` must not leave a file the glob keeps
    // building: `lake build` would go on proving a machine nobody has.
    expect(onDisk).toEqual(expected);
    expect(onDisk).toHaveLength(5);
  });

  it('T-PROJ-003 the root module imports each machine, so `import KiwaSpecs` reaches them', () => {
    const root = read(`${ROOT_NAMESPACE}.lean`);

    for (const spec of ALL_SPECS) {
      expect(root).toContain(`import ${ROOT_NAMESPACE}.${spec.moduleName}`);
    }
  });

  it('T-PROJ-004 the build has a default target, or it builds nothing and succeeds', () => {
    const lakefile = read('lakefile.lean');

    expect(lakefile).toContain('@[default_target]');
    expect(lakefile).toContain(`lean_lib «${ROOT_NAMESPACE}»`);
  });
});

describe('the checked-in files are what the specs render', () => {
  it('T-PROJ-012 the render names every machine, and nothing else', () => {
    // `T-PROJ-010` iterates the keys of the render, so a render that drops a
    // machine drops a test case with it and stays green — as does `T-PROJ-002`,
    // which reads the disk and never asks what the render would have written.
    // A generator can lose a machine between the two of them.
    const rendered = Object.keys(renderLeanProject()).sort();
    const expected = [
      'lakefile.lean',
      'lean-toolchain',
      `${ROOT_NAMESPACE}.lean`,
      ...ALL_SPECS.map((spec) => `${ROOT_NAMESPACE}/${spec.moduleName}.lean`),
    ].sort();

    expect(rendered).toEqual(expected);
    expect(rendered).toHaveLength(8);
  });

  it.each(Object.keys(renderLeanProject()).sort())('T-PROJ-010 %s is byte-identical', (rel) => {
    // Edit a spec without regenerating and this fails. It is the only thing that
    // notices: `lake build` proves whatever is on disk, and it stays true of the
    // machine it describes.
    expect(read(rel)).toBe(renderLeanProject()[rel]);
  });

  it('T-PROJ-011 a spec edited without regenerating is caught', () => {
    // The check must be able to fail. Move a cell in the spec and the file on
    // disk stops being what the spec renders.
    //
    // The cell has to be one whose move leaves every state reachable: take away
    // `active + commit-requested` and nothing reaches `committing`, so the
    // generator refuses the spec before it can render anything to compare.
    const [first] = ALL_SPECS;
    const drifted = {
      ...first,
      transitions: first.transitions.map((t) =>
        t.from === 'savepoint-nested' && t.event === 'query-executed' ? { ...t, to: 'active' } : t,
      ),
    };

    const rendered = generateLeanSpec(drifted).source;

    expect(rendered).not.toBe(read(`${ROOT_NAMESPACE}/${first.moduleName}.lean`));
  });
});

describe.skipIf(!HAS_LEAN)('the checked-in files hold the tables the specs describe', () => {
  it.each(ALL_SPECS.map((spec) => [spec.namespace, spec] as const))(
    'T-PROJ-020 %s: the file on disk computes the spec table',
    (_name, spec) => {
      // Not the generator's output — the bytes in the repository, read back and
      // handed to Lean. This is the check a consumer runs against a file a human
      // may have touched.
      const source = read(`${ROOT_NAMESPACE}/${spec.moduleName}.lean`);
      const report = checkLeanTable(spec, { source });

      expect(report.status).toBe('ok');
      expect(report.disagreements).toEqual([]);
      expect(report.checked).toBe(40);
    },
    120_000,
  );

  it('T-PROJ-021 a cell moved in a checked-in file is caught, and named', () => {
    const [spec] = ALL_SPECS;
    const source = read(`${ROOT_NAMESPACE}/${spec.moduleName}.lean`);

    // `savepoint-nested + query-executed` loops back to itself and carries no
    // theorem's witness: Lean accepts the file, and only the table disagrees.
    const moved = source.replace(
      '| .SavepointNested, .QueryExecuted     => .to .SavepointNested',
      '| .SavepointNested, .QueryExecuted     => .to .Active',
    );
    expect(moved).not.toBe(source);

    const report = checkLeanTable(spec, { source: moved });

    expect(report.status).toBe('ok');
    expect(report.ok).toBe(false);
    expect(report.disagreements).toHaveLength(1);
    expect(report.disagreements[0]).toMatchObject({
      state: 'savepoint-nested',
      event: 'query-executed',
      spec: 'savepoint-nested',
      lean: 'active',
    });
  }, 120_000);

  it('T-PROJ-022 a theorem falsified in a checked-in file is caught as a proof failure', () => {
    const [spec] = ALL_SPECS;
    const source = read(`${ROOT_NAMESPACE}/${spec.moduleName}.lean`);

    // `aborted` accepts nothing. Claim it goes somewhere and Lean refuses the
    // file: no table comes back, and the status says which kind of wrong it is.
    const lying = source.replace(
      /theorem aborted_absorbing[\s\S]*?rfl\n/,
      'theorem aborted_absorbing : ∀ e, dispatch .Aborted e = .to .Active := by\n  intro e; cases e <;> rfl\n',
    );
    expect(lying).not.toBe(source);

    const report = checkLeanTable(spec, { source: lying });

    expect(report.status).toBe('verification-failed');
    expect(report.ok).toBe(false);
    expect(report.diagnostics).toContain('error:');
  }, 120_000);
});

describe.skipIf(!HAS_LEAN)('the verify path, which nothing here used to walk', () => {
  it('T-PROJ-030 verifyLeanSpec proves all five machines in one run', () => {
    const result = verifyLeanSpec(ALL_SPECS.map((spec) => generateLeanSpec(spec)));

    expect(result.status).toBe('ok');
    expect(result.verifiedFiles).toEqual(
      ALL_SPECS.map((spec) => `${ROOT_NAMESPACE}/${spec.moduleName}.lean`),
    );
  }, 300_000);

  it('T-PROJ-031 a false theorem in one of the five is refused, and its file is named', () => {
    // The job machine, third of five, so the failure has to be attributed rather
    // than assumed: the specs are concatenated into one file before Lean sees them.
    const target = 'JobLifecycleOrchestrator';
    let falsified = false;
    const broken = ALL_SPECS.map((spec) => {
      const out = generateLeanSpec(spec);
      if (spec.moduleName !== target) return out;
      const source = out.source.replace(
        /theorem completed_absorbing[\s\S]*?rfl\n/,
        'theorem completed_absorbing : ∀ e, dispatch .Completed e = .to .Queued := by\n  intro e; cases e <;> rfl\n',
      );
      falsified = source !== out.source;
      return { ...out, source };
    });
    expect(falsified).toBe(true);

    const result = verifyLeanSpec(broken);

    expect(result.status).toBe('verification-failed');
    // The positions are rewritten so the error points at the module a reader can
    // open, not at a line of a temporary file that no longer exists.
    expect(result.diagnostics).toContain(`${ROOT_NAMESPACE}/${target}.lean`);
  }, 300_000);
});

describe.skipIf(!HAS_LAKE)('lake builds the project that is checked in', () => {
  it('T-PROJ-040 `lake build` exits 0, having built every machine', () => {
    // `lake` elaborates every module the glob reaches, which is every machine.
    // It is the command a consumer runs, and until now nothing here ran it.
    //
    // Exit 0 alone does not say it built anything: a lakefile without
    // `@[default_target]` succeeds having compiled nothing at all. The artifacts
    // are the evidence — but only if this run produced them. Left in place, the
    // oleans of an earlier run satisfy the assertion on behalf of a build that
    // did nothing, which is the failure the assertion exists to catch.
    rmSync(join(SPECS_ROOT, '.lake', 'build'), { recursive: true, force: true });

    const out = execFileSync('lake', ['build'], {
      cwd: SPECS_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    expect(out).not.toContain('error:');
    for (const spec of ALL_SPECS) {
      const olean = join(SPECS_ROOT, '.lake', 'build', 'lib', ROOT_NAMESPACE, `${spec.moduleName}.olean`);
      expect(existsSync(olean), `lake built no artifact for ${spec.moduleName}`).toBe(true);
    }
  }, 600_000);
});
