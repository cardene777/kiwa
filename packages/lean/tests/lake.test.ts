import { describe, expect, it } from 'vitest';
import { generateLakeProject } from '../src/lake.js';

describe('generateLakeProject — minimal Lake scaffolding', () => {
  it('T-LEAN-LAKE-001 emits lakefile.lean, lean-toolchain, root module', () => {
    const out = generateLakeProject({
      packageName: 'kiwa-lean-specs',
      rootNamespace: 'KiwaSpecs',
    });
    expect(Object.keys(out.files).sort()).toEqual(
      ['KiwaSpecs.lean', 'lakefile.lean', 'lean-toolchain'].sort(),
    );
  });

  it('T-LEAN-LAKE-002 lakefile declares the package and lean_lib', () => {
    const out = generateLakeProject({
      packageName: 'kiwa-lean-specs',
      rootNamespace: 'KiwaSpecs',
    });
    expect(out.files['lakefile.lean']).toContain('package «kiwa-lean-specs»');
    expect(out.files['lakefile.lean']).toContain('lean_lib «KiwaSpecs»');
  });

  it('T-LEAN-LAKE-003 pins a reproducible lean-toolchain', () => {
    const out = generateLakeProject({
      packageName: 'p',
      rootNamespace: 'N',
    });
    expect(out.files['lean-toolchain']).toMatch(/^leanprover\/lean4:v\d+\.\d+\.\d+\n?$/);
  });

  it('T-LEAN-LAKE-004 overrides the toolchain when provided', () => {
    const out = generateLakeProject({
      packageName: 'p',
      rootNamespace: 'N',
      leanToolchain: 'leanprover/lean4:v4.16.0',
    });
    expect(out.files['lean-toolchain']).toBe('leanprover/lean4:v4.16.0\n');
  });

  it('T-LEAN-LAKE-005 the library is a default target, or lake build builds nothing', () => {
    // Without the attribute, `lake build` has no targets and reports success on a
    // project whose specs do not compile.
    const out = generateLakeProject({ packageName: 'p', rootNamespace: 'KiwaSpecs' });
    expect(out.files['lakefile.lean']).toContain('@[default_target]');
  });

  it('T-LEAN-LAKE-006 a glob collects the specs, so an unimported one is still built', () => {
    const out = generateLakeProject({ packageName: 'p', rootNamespace: 'KiwaSpecs' });
    expect(out.files['lakefile.lean']).toContain('globs := #[.andSubmodules `KiwaSpecs]');
  });

  it('T-LEAN-LAKE-007 the root module imports the named modules', () => {
    const out = generateLakeProject({
      packageName: 'p',
      rootNamespace: 'KiwaSpecs',
      modules: ['TransactionOrchestrator', 'SessionOrchestrator'],
    });
    expect(out.files['KiwaSpecs.lean']).toContain('import KiwaSpecs.TransactionOrchestrator');
    expect(out.files['KiwaSpecs.lean']).toContain('import KiwaSpecs.SessionOrchestrator');
  });

  it('T-LEAN-LAKE-008 with no modules the root module says the glob does the work', () => {
    const out = generateLakeProject({ packageName: 'p', rootNamespace: 'KiwaSpecs' });
    const statements = (out.files['KiwaSpecs.lean'] ?? '')
      .split('\n')
      .filter((line) => line.startsWith('import '));
    expect(statements).toEqual([]);
    expect(out.files['KiwaSpecs.lean']).toContain('built by the glob');
  });
});
