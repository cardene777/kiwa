/**
 * Scanner end-to-end fidelity spec (scanner axis: OSV / NVD advisory
 * lookup + combined SBOM + secrets-scan Trivy-style report).
 *
 * Sub-Issue CAR-828 (v1.37-4) AC — the mock adapter composes the SBOM +
 * secret findings + license verdicts into a single Trivy-style report and
 * the fidelity harness diffs the raw {@link TraceEvent} sequence across
 * five axes.
 *
 *  1. lookupAdvisories returns advisories matching a component + version.
 *  2. lookupAdvisories skips advisories that don't match the version range.
 *  3. buildReport counts componentCount / vulnerableCount / secretsCount.
 *  4. buildReport escalates the overallVerdict to deny when any critical
 *     advisory or license deny hits.
 *  5. buildReport keeps the overallVerdict at allow when the SBOM is
 *     clean.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Advisory } from '@kiwa-test/security';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleScannerRequest,
  validateScannerRequest,
} from '../src/app/scanner/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

const FIXTURE_AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';

const CRITICAL_ADVISORY: Advisory = {
  id: 'GHSA-critical-lodash',
  affects: [{ purl: 'pkg:npm/lodash', versionRange: '< 4.17.21' }],
  severity: 'critical',
  summary: 'Prototype pollution in lodash < 4.17.21',
  source: 'osv',
};

const LOW_ADVISORY: Advisory = {
  id: 'GHSA-low-a',
  affects: [{ purl: 'pkg:npm/a', versionRange: '< 2.0.0' }],
  severity: 'low',
  summary: 'Minor issue in a < 2.0.0',
  source: 'nvd',
};

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

async function seedSbom(sbomId: string, components: Array<{ name: string; version: string; purl: string; license?: string }>): Promise<void> {
  await mock.startSbom({ sbomId });
  for (const component of components) {
    await mock.addComponent({ sbomId, component });
  }
}

async function seedSecrets(scanId: string, source: string): Promise<void> {
  await mock.startSecrets({ scanId, rotateWithinDays: 30 });
  await mock.scanSource({ scanId, source });
}

describe('mock adapter — OSV / NVD advisory lookup', () => {
  it('axis 1: lookupAdvisories returns matching advisories for lodash 4.17.20', async () => {
    await seedSbom('sbom1', [{ name: 'lodash', version: '4.17.20', purl: 'pkg:npm/lodash@4.17.20', license: 'MIT' }]);
    await seedSecrets('scan1', 'clean');
    const result = await mock.lookupAdvisories({
      scanId: 'scan1',
      sbomId: 'sbom1',
      feed: { advisories: [CRITICAL_ADVISORY] },
    });
    expect(result.advisories.length).toBe(1);
    expect(result.advisories[0]!.advisories[0]!.id).toBe('GHSA-critical-lodash');
  });

  it('axis 2: lookupAdvisories skips advisories out of range', async () => {
    await seedSbom('sbom2', [{ name: 'lodash', version: '4.17.21', purl: 'pkg:npm/lodash@4.17.21', license: 'MIT' }]);
    await seedSecrets('scan2', 'clean');
    const result = await mock.lookupAdvisories({
      scanId: 'scan2',
      sbomId: 'sbom2',
      feed: { advisories: [CRITICAL_ADVISORY] },
    });
    expect(result.advisories.length).toBe(0);
  });

  it('axis 1: lookupAdvisories combines multiple advisories per component', async () => {
    await seedSbom('sbom3', [{ name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0', license: 'MIT' }]);
    await seedSecrets('scan3', 'clean');
    const secondLow: Advisory = { ...LOW_ADVISORY, id: 'GHSA-low-a-2' };
    const result = await mock.lookupAdvisories({
      scanId: 'scan3',
      sbomId: 'sbom3',
      feed: { advisories: [LOW_ADVISORY, secondLow] },
    });
    expect(result.advisories[0]!.advisories.length).toBe(2);
  });

  it('axis 1: lookupAdvisories on missing sbom fails', async () => {
    await seedSecrets('scan4', 'clean');
    await expect(
      mock.lookupAdvisories({
        scanId: 'scan4',
        sbomId: 'missing',
        feed: { advisories: [] },
      }),
    ).rejects.toThrow(/sbom_session_missing/);
  });
});

describe('mock adapter — composed Trivy-style report', () => {
  it('axis 3: buildReport counts componentCount / vulnerableCount / secretsCount', async () => {
    await seedSbom('sbom5', [
      { name: 'lodash', version: '4.17.20', purl: 'pkg:npm/lodash@4.17.20', license: 'MIT' },
      { name: 'clean', version: '1.0.0', purl: 'pkg:npm/clean@1.0.0', license: 'Apache-2.0' },
    ]);
    await seedSecrets('scan5', `const k = "${FIXTURE_AWS_KEY}";`);
    const report = await mock.buildReport({
      scanId: 'scan5',
      sbomId: 'sbom5',
      feed: { advisories: [CRITICAL_ADVISORY] },
    });
    expect(report.componentCount).toBe(2);
    expect(report.vulnerableCount).toBe(1);
    expect(report.secretsCount).toBeGreaterThanOrEqual(1);
  });

  it('axis 4: buildReport escalates verdict to deny on critical advisory', async () => {
    await seedSbom('sbom6', [{ name: 'lodash', version: '4.17.20', purl: 'pkg:npm/lodash@4.17.20', license: 'MIT' }]);
    await seedSecrets('scan6', 'clean');
    const report = await mock.buildReport({
      scanId: 'scan6',
      sbomId: 'sbom6',
      feed: { advisories: [CRITICAL_ADVISORY] },
    });
    expect(report.overallVerdict).toBe('deny');
  });

  it('axis 4: buildReport escalates verdict to deny on license deny', async () => {
    await seedSbom('sbom7', [{ name: 'gnu', version: '1.0.0', purl: 'pkg:npm/gnu@1.0.0', license: 'GPL-3.0' }]);
    await seedSecrets('scan7', 'clean');
    const report = await mock.buildReport({
      scanId: 'scan7',
      sbomId: 'sbom7',
      feed: { advisories: [] },
    });
    expect(report.overallVerdict).toBe('deny');
    expect(report.licenseDenies).toBe(1);
  });

  it('axis 4: buildReport escalates to warn on low-severity advisory', async () => {
    await seedSbom('sbom8', [{ name: 'a', version: '1.0.0', purl: 'pkg:npm/a@1.0.0', license: 'MIT' }]);
    await seedSecrets('scan8', 'clean');
    const report = await mock.buildReport({
      scanId: 'scan8',
      sbomId: 'sbom8',
      feed: { advisories: [LOW_ADVISORY] },
    });
    expect(report.overallVerdict).toBe('warn');
  });

  it('axis 4: buildReport escalates to warn on secret finding', async () => {
    await seedSbom('sbom9', [{ name: 'clean', version: '1.0.0', purl: 'pkg:npm/clean@1.0.0', license: 'MIT' }]);
    await seedSecrets('scan9', `const k = "${FIXTURE_AWS_KEY}";`);
    const report = await mock.buildReport({
      scanId: 'scan9',
      sbomId: 'sbom9',
      feed: { advisories: [] },
    });
    expect(report.overallVerdict).toBe('warn');
    expect(report.secretsCount).toBeGreaterThanOrEqual(1);
  });

  it('axis 5: buildReport keeps allow verdict on clean SBOM + no findings', async () => {
    await seedSbom('sbom10', [{ name: 'clean', version: '1.0.0', purl: 'pkg:npm/clean@1.0.0', license: 'MIT' }]);
    await seedSecrets('scan10', 'clean');
    const report = await mock.buildReport({
      scanId: 'scan10',
      sbomId: 'sbom10',
      feed: { advisories: [] },
    });
    expect(report.overallVerdict).toBe('allow');
    expect(report.vulnerableCount).toBe(0);
    expect(report.secretsCount).toBe(0);
    expect(report.licenseDenies).toBe(0);
  });
});

describe('scanner route handler contract', () => {
  it('validateScannerRequest rejects unrecognised kind', () => {
    const result = validateScannerRequest({
      scanId: 's',
      sbomId: 'b',
      kind: 'nope',
      feed: { advisories: [] },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_must_be_lookup_or_report');
  });

  it('validateScannerRequest rejects malformed advisory feed', () => {
    const result = validateScannerRequest({
      scanId: 's',
      sbomId: 'b',
      kind: 'lookup',
      feed: { advisories: [{ id: 'x', severity: 'unknown' }] },
    });
    expect(result.ok).toBe(false);
  });

  it('validateScannerRequest accepts a well-formed advisory feed', () => {
    const result = validateScannerRequest({
      scanId: 's',
      sbomId: 'b',
      kind: 'lookup',
      feed: {
        advisories: [
          {
            id: 'GHSA-1',
            severity: 'low',
            summary: 'x',
            source: 'osv',
            affects: [{ purl: 'pkg:npm/a', versionRange: '< 2.0.0' }],
          },
        ],
      },
    });
    expect(result.ok).toBe(true);
  });

  it('handleScannerRequest returns a report response', async () => {
    await seedSbom('sbom11', [{ name: 'x', version: '1.0.0', purl: 'pkg:npm/x@1.0.0', license: 'MIT' }]);
    await seedSecrets('scan11', 'clean');
    const response = await handleScannerRequest(mock, {
      kind: 'report',
      scanId: 'scan11',
      sbomId: 'sbom11',
      feed: { advisories: [] },
    });
    expect(response.ok).toBe(true);
    expect(response.overallVerdict).toBe('allow');
  });

  it('handleScannerRequest surfaces adapter errors as errorKind', async () => {
    const response = await handleScannerRequest(mock, {
      kind: 'lookup',
      scanId: 'missing-scan',
      sbomId: 'missing-sbom',
      feed: { advisories: [] },
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('sbom_session_missing');
  });
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing reports KIWA_TRIVY_ENDPOINT_MISSING when ready but endpoint missing', () => {
    const prev = { ...process.env };
    process.env['KIWA_MODE'] = 'real';
    process.env['SBOM_SCANNER_READY'] = '1';
    delete process.env['KIWA_TRIVY_ENDPOINT'];
    try {
      expect(detectRealEnvMissing()).toBe('KIWA_TRIVY_ENDPOINT_MISSING');
    } finally {
      process.env = prev;
    }
  });

  it('makeRealAdapter refuses buildReport with KIWA_SBOM_ENV_MISSING', async () => {
    const real = makeRealAdapter();
    await expect(
      real.buildReport({ scanId: 'x', sbomId: 'y', feed: { advisories: [] } }),
    ).rejects.toThrow(/KIWA_SBOM_ENV_MISSING/);
  });
});
