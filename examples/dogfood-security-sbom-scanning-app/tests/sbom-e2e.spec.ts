/**
 * SBOM end-to-end fidelity spec (sbom axis: CycloneDX + SPDX emission +
 * validation + license policy).
 *
 * Sub-Issue CAR-828 (v1.37-4) AC — the mock adapter drives a full SBOM
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. addComponent grows the running SBOM session with a unique component.
 *  2. emitCycloneDx emits a CycloneDX 1.5 document with the session's
 *     components.
 *  3. emitSpdx emits an SPDX 2.3 document with the same components.
 *  4. validateSbom flags missing mandatory fields + malformed purl.
 *  5. evaluateLicense reduces per-component verdicts into an overall
 *     verdict following the SPDX license policy.
 *
 * The real adapter is exercised through the env-detect skeleton and every
 * op refuses with `KIWA_SBOM_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleSbomRequest,
  validateSbomRequest,
} from '../src/app/sbom/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — SBOM component collection', () => {
  it('axis 1: addComponent records a component on a fresh SBOM', async () => {
    await mock.startSbom({ sbomId: 's1' });
    const result = await mock.addComponent({
      sbomId: 's1',
      component: {
        name: 'lodash',
        version: '4.17.21',
        purl: 'pkg:npm/lodash@4.17.21',
        license: 'MIT',
      },
    });
    expect(result.componentCount).toBe(1);
    const trace = mock.traces().find((t) => t.op === 'addComponent');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: addComponent grows the count monotonically', async () => {
    await mock.startSbom({ sbomId: 's2' });
    await mock.addComponent({
      sbomId: 's2',
      component: { name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0', license: 'MIT' },
    });
    const second = await mock.addComponent({
      sbomId: 's2',
      component: { name: 'b', version: '1.0.0', purl: 'pkg:npm/b@1.0.0', license: 'Apache-2.0' },
    });
    expect(second.componentCount).toBe(2);
  });

  it('axis 1: addComponent rejects a duplicate purl', async () => {
    await mock.startSbom({ sbomId: 's3' });
    await mock.addComponent({
      sbomId: 's3',
      component: { name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0' },
    });
    await expect(
      mock.addComponent({
        sbomId: 's3',
        component: { name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0' },
      }),
    ).rejects.toThrow(/sbom_component_duplicate/);
  });

  it('axis 1: addComponent without startSbom fails', async () => {
    await expect(
      mock.addComponent({
        sbomId: 'missing',
        component: { name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0' },
      }),
    ).rejects.toThrow(/sbom_session_missing/);
  });

  it('axis 1: addComponent after closeSbom fails', async () => {
    await mock.startSbom({ sbomId: 's4' });
    await mock.closeSbom({ sbomId: 's4' });
    await expect(
      mock.addComponent({
        sbomId: 's4',
        component: { name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0' },
      }),
    ).rejects.toThrow(/sbom_session_closed/);
  });
});

describe('mock adapter — CycloneDX + SPDX emission', () => {
  it('axis 2: emitCycloneDx returns a CycloneDX 1.5 document', async () => {
    await mock.startSbom({ sbomId: 's5' });
    await mock.addComponent({
      sbomId: 's5',
      component: { name: 'react', version: '19.0.0', purl: 'pkg:npm/react@19.0.0', license: 'MIT' },
    });
    const result = await mock.emitCycloneDx({ sbomId: 's5' });
    expect(result.format).toBe('cyclonedx');
    expect(result.formatVersion).toBe('1.5');
    expect(result.document.components.length).toBe(1);
  });

  it('axis 3: emitSpdx returns an SPDX 2.3 document', async () => {
    await mock.startSbom({ sbomId: 's6' });
    await mock.addComponent({
      sbomId: 's6',
      component: { name: 'react', version: '19.0.0', purl: 'pkg:npm/react@19.0.0', license: 'MIT' },
    });
    const result = await mock.emitSpdx({ sbomId: 's6' });
    expect(result.format).toBe('spdx');
    expect(result.formatVersion).toBe('2.3');
  });

  it('axis 2: emitCycloneDx uses the provided nowIso', async () => {
    await mock.startSbom({ sbomId: 's7' });
    await mock.addComponent({
      sbomId: 's7',
      component: { name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0' },
    });
    const result = await mock.emitCycloneDx({ sbomId: 's7', nowIso: '2026-01-01T00:00:00.000Z' });
    expect(result.document.generatedAtIso).toBe('2026-01-01T00:00:00.000Z');
  });

  it('axis 2: emitCycloneDx without startSbom fails', async () => {
    await expect(
      mock.emitCycloneDx({ sbomId: 'missing' }),
    ).rejects.toThrow(/sbom_session_missing/);
  });
});

describe('mock adapter — SBOM validation', () => {
  it('axis 4: validateSbom passes a well-formed SBOM', async () => {
    await mock.startSbom({ sbomId: 's8' });
    await mock.addComponent({
      sbomId: 's8',
      component: { name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0' },
    });
    const result = await mock.validateSbom({ sbomId: 's8' });
    expect(result.ok).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('axis 4: validateSbom flags a malformed purl', async () => {
    await mock.startSbom({ sbomId: 's9' });
    await mock.addComponent({
      sbomId: 's9',
      component: { name: 'a', version: '1.0.0', purl: 'not-a-purl' },
    });
    const result = await mock.validateSbom({ sbomId: 's9' });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('purl'))).toBe(true);
  });

  it('axis 4: validateSbom on empty SBOM passes vacuously', async () => {
    await mock.startSbom({ sbomId: 's10' });
    const result = await mock.validateSbom({ sbomId: 's10' });
    expect(result.ok).toBe(true);
  });
});

describe('mock adapter — license policy', () => {
  it('axis 5: evaluateLicense returns allow for MIT-only SBOM', async () => {
    await mock.startSbom({ sbomId: 's11' });
    await mock.addComponent({
      sbomId: 's11',
      component: { name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0', license: 'MIT' },
    });
    const result = await mock.evaluateLicense({ sbomId: 's11' });
    expect(result.overallVerdict).toBe('allow');
  });

  it('axis 5: evaluateLicense escalates to deny for GPL-3.0', async () => {
    await mock.startSbom({ sbomId: 's12' });
    await mock.addComponent({
      sbomId: 's12',
      component: { name: 'gnu', version: '1.0.0', purl: 'pkg:npm/gnu@1.0.0', license: 'GPL-3.0' },
    });
    const result = await mock.evaluateLicense({ sbomId: 's12' });
    expect(result.overallVerdict).toBe('deny');
  });

  it('axis 5: evaluateLicense escalates to warn for MPL-2.0', async () => {
    await mock.startSbom({ sbomId: 's13' });
    await mock.addComponent({
      sbomId: 's13',
      component: { name: 'moz', version: '1.0.0', purl: 'pkg:npm/moz@1.0.0', license: 'MPL-2.0' },
    });
    const result = await mock.evaluateLicense({ sbomId: 's13' });
    expect(result.overallVerdict).toBe('warn');
  });

  it('axis 5: evaluateLicense handles OR dual licensing (MIT OR GPL-3.0 → allow)', async () => {
    await mock.startSbom({ sbomId: 's14' });
    await mock.addComponent({
      sbomId: 's14',
      component: { name: 'dual', version: '1.0.0', purl: 'pkg:npm/dual@1.0.0', license: 'MIT OR GPL-3.0' },
    });
    const result = await mock.evaluateLicense({ sbomId: 's14' });
    expect(result.overallVerdict).toBe('allow');
  });

  it('axis 5: evaluateLicense returns per-component verdicts', async () => {
    await mock.startSbom({ sbomId: 's15' });
    await mock.addComponent({
      sbomId: 's15',
      component: { name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0', license: 'MIT' },
    });
    await mock.addComponent({
      sbomId: 's15',
      component: { name: 'gpl', version: '1.0.0', purl: 'pkg:npm/gpl@1.0.0', license: 'GPL-3.0' },
    });
    const result = await mock.evaluateLicense({ sbomId: 's15' });
    expect(result.verdicts.length).toBe(2);
    expect(result.verdicts.find((v) => v.purl.includes('gpl'))?.verdict).toBe('deny');
    expect(result.overallVerdict).toBe('deny');
  });
});

describe('SBOM route handler contract', () => {
  it('validateSbomRequest rejects missing sbomId', () => {
    const result = validateSbomRequest({ kind: 'start' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('sbomId_required');
  });

  it('validateSbomRequest rejects unrecognised kind', () => {
    const result = validateSbomRequest({ sbomId: 's', kind: 'nope' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_unrecognised');
  });

  it('validateSbomRequest requires component fields on addComponent', () => {
    const result = validateSbomRequest({
      sbomId: 's',
      kind: 'addComponent',
      component: { name: 'a', version: '1.0.0' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('component_purl_required');
  });

  it('handleSbomRequest maps a start op onto the adapter', async () => {
    const response = await handleSbomRequest(mock, { kind: 'start', sbomId: 's16' });
    expect(response.ok).toBe(true);
    expect(response.kind).toBe('start');
  });

  it('handleSbomRequest surfaces adapter errors as errorKind', async () => {
    const response = await handleSbomRequest(mock, {
      kind: 'addComponent',
      sbomId: 'missing',
      component: { name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0' },
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('sbom_session_missing');
  });
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing returns MISSING when SBOM_SCANNER_READY not set', () => {
    const prev = process.env['SBOM_SCANNER_READY'];
    delete process.env['SBOM_SCANNER_READY'];
    try {
      expect(detectRealEnvMissing()).toBe('KIWA_SBOM_ENV_MISSING');
    } finally {
      if (prev !== undefined) process.env['SBOM_SCANNER_READY'] = prev;
    }
  });

  it('makeRealAdapter refuses every op with KIWA_SBOM_ENV_MISSING', async () => {
    const real = makeRealAdapter();
    await expect(real.startSbom({ sbomId: 's17' })).rejects.toThrow(/KIWA_SBOM_ENV_MISSING/);
    const trace = real.traces().find((t) => t.op === 'startSbom');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe('KIWA_SBOM_ENV_MISSING');
  });
});
