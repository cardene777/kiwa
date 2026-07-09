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
});
