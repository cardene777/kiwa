import { describe, expect, it } from 'vitest';
import { evaluateLicense, lookupAdvisories, toCycloneDx, versionInRange } from '../src/index.js';
import type { Advisory, LicensePolicy, SbomComponent } from '../src/index.js';

describe('SBOM — license clause OR', () => {
  const permissive: LicensePolicy = {
    allow: ['MIT'],
    warn: ['MPL-2.0'],
    deny: ['GPL-3.0', 'AGPL-3.0'],
  };

  it('T-SEC-SBOM-L-001 OR expression picks most permissive: allow beats deny', () => {
    expect(evaluateLicense('GPL-3.0 OR MIT', permissive)).toBe('allow');
  });

  it('T-SEC-SBOM-L-002 OR expression picks warn when no allow', () => {
    expect(evaluateLicense('GPL-3.0 OR MPL-2.0', permissive)).toBe('warn');
  });

  it('T-SEC-SBOM-L-003 OR expression picks deny when all clauses deny', () => {
    expect(evaluateLicense('GPL-3.0 OR AGPL-3.0', permissive)).toBe('deny');
  });

  it('T-SEC-SBOM-L-004 unknown license clause becomes warn', () => {
    expect(evaluateLicense('SOMETHING-NEW', permissive)).toBe('warn');
  });

  it('T-SEC-SBOM-L-005 empty policy warns for known license too', () => {
    const empty: LicensePolicy = { allow: [], warn: [], deny: [] };
    expect(evaluateLicense('MIT', empty)).toBe('warn');
  });
});

describe('SBOM — version range specialised', () => {
  it('T-SEC-SBOM-V-001 supports patch-level compare', () => {
    expect(versionInRange('1.0.10', '< 1.0.11')).toBe(true);
    expect(versionInRange('1.0.10', '< 1.0.9')).toBe(false);
  });

  it('T-SEC-SBOM-V-002 handles missing patch segment', () => {
    expect(versionInRange('1.2', '>= 1.0')).toBe(true);
  });

  it('T-SEC-SBOM-V-003 handles missing minor segment', () => {
    expect(versionInRange('2', '>= 1')).toBe(true);
  });

  it('T-SEC-SBOM-V-004 unknown clause returns exact-match fallback', () => {
    expect(versionInRange('1.2.3', 'random-string')).toBe(false);
  });

  it('T-SEC-SBOM-V-005 <= boundary passes', () => {
    expect(versionInRange('1.2.3', '<= 1.2.3')).toBe(true);
  });

  it('T-SEC-SBOM-V-006 > boundary is strict', () => {
    expect(versionInRange('1.2.3', '> 1.2.3')).toBe(false);
    expect(versionInRange('1.2.4', '> 1.2.3')).toBe(true);
  });
});

describe('SBOM — advisory lookup with multi-hit', () => {
  const advisories: Advisory[] = [
    {
      id: 'CVE-A',
      affects: [{ purl: 'pkg:npm/lodash', versionRange: '< 4.17.21' }],
      severity: 'high',
      summary: 'A',
      source: 'osv',
    },
    {
      id: 'CVE-B',
      affects: [{ purl: 'pkg:npm/lodash', versionRange: '>= 3.0.0' }],
      severity: 'medium',
      summary: 'B',
      source: 'nvd',
    },
  ];

  it('T-SEC-SBOM-A-001 single component matches multiple advisories', () => {
    const doc = toCycloneDx([
      { name: 'lodash', version: '4.17.20', purl: 'pkg:npm/lodash@4.17.20', license: 'MIT' },
    ] as SbomComponent[]);
    const hits = lookupAdvisories(doc, { advisories });
    const lodashHits = hits.find((h) => h.component.name === 'lodash');
    expect(lodashHits?.advisories.map((a) => a.id).sort()).toEqual(['CVE-A', 'CVE-B']);
  });
});
