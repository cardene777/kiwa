/**
 * The surface a consumer sees, and the promises it makes about running Lean.
 *
 * A library is used from a build that decides, once, whether Lean runs at all.
 * Two functions that read that decision differently means one of them runs a
 * toolchain the build turned off.
 */

import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { checkLeanTable, extractLeanTable } from '../src/extract.js';
import { generateLeanSpec } from '../src/generator.js';
import { UsageError } from '../src/errors.js';
import { verifyLeanSpec } from '../src/verify.js';
import type { OrchestratorSpec } from '../src/types.js';

function leanInstalled(): boolean {
  try {
    execFileSync('lean', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const HAS_LEAN = leanInstalled();

const SPEC: OrchestratorSpec = {
  moduleName: 'Probe',
  namespace: 'Probe',
  states: ['a', 'b'],
  events: ['e'],
  unspecified: 'invalid',
  transitions: [{ from: 'a', event: 'e', to: 'b' }],
};

const output = () => [generateLeanSpec(SPEC)];

afterEach(() => {
  delete process.env.KIWA_LEAN_SKIP_VERIFY;
});

describe('turning Lean off turns it off everywhere', () => {
  it('T-API-001 KIWA_LEAN_SKIP_VERIFY stops verification', () => {
    process.env.KIWA_LEAN_SKIP_VERIFY = '1';
    expect(verifyLeanSpec(output()).status).toBe('skipped-by-env');
  });

  it('T-API-002 KIWA_LEAN_SKIP_VERIFY stops table extraction too', () => {
    // It used to go and run Lean anyway, in a build that had said not to.
    process.env.KIWA_LEAN_SKIP_VERIFY = '1';

    const report = checkLeanTable(SPEC);

    expect(report.status).toBe('skipped-by-env');
    expect(report.ok).toBe(false);
  });

  it('T-API-003 opts.skip stops table extraction', () => {
    const report = checkLeanTable(SPEC, { skip: true });

    expect(report.status).toBe('skipped-by-env');
    expect(report.ok).toBe(false);
    expect(report.checked).toBe(0);
  });

  it('T-API-004 a skip never runs Lean, whatever else it is handed', () => {
    // A bogus binary would fail if it were reached.
    const result = extractLeanTable('namespace X\nend X\n', SPEC, {
      skip: true,
      leanBin: '/definitely/not/lean/xyz',
    });

    expect(result.status).toBe('skipped-by-env');
  });

  it('T-API-005 a skip is not a pass', () => {
    // `ok` stays false: nothing was established. A build that wants Lean off and
    // its checks green has to say so itself.
    expect(checkLeanTable(SPEC, { skip: true }).ok).toBe(false);
  });

  it.skipIf(!HAS_LEAN)('T-API-006 without the switch, Lean runs', () => {
    expect(checkLeanTable(SPEC).status).toBe('ok');
  });
});

describe('rootNamespace becomes a path the caller writes to', () => {
  it('T-API-010 a namespace that climbs out of its directory is refused', () => {
    expect(() => verifyLeanSpec(output(), { rootNamespace: '../../etc', skip: true })).toThrow(
      UsageError,
    );
    expect(() => verifyLeanSpec(output(), { rootNamespace: '../../etc', skip: true })).toThrow(
      /is not a Lean identifier/,
    );
  });

  it('T-API-011 the check runs before the skip path', () => {
    // Skipping the verification does not make a bad call a good one.
    expect(() => verifyLeanSpec(output(), { rootNamespace: 'a b', skip: true })).toThrow(UsageError);
  });

  it('T-API-012 a real namespace is accepted, and names the files', () => {
    const result = verifyLeanSpec(output(), { rootNamespace: 'KiwaSpecs', skip: true });
    expect(result.verifiedFiles).toEqual(['KiwaSpecs/Probe.lean']);
  });
});

describe('the package does not modify what it is given', () => {
  it('T-API-020 generateLeanSpec leaves the spec alone', () => {
    const spec = structuredClone(SPEC);
    const before = JSON.stringify(spec);

    generateLeanSpec(spec);

    expect(JSON.stringify(spec)).toBe(before);
  });

  it('T-API-021 verifyLeanSpec leaves its options alone', () => {
    const opts = { skip: true, rootNamespace: 'KiwaSpecs' };
    const before = JSON.stringify(opts);

    verifyLeanSpec(output(), opts);

    expect(JSON.stringify(opts)).toBe(before);
  });
});
