import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LICENSE_POLICY,
  evaluateLicense,
  lookupAdvisories,
  toCycloneDx,
  toSbomEvent,
  toSpdx,
  validateSbom,
  versionInRange,
} from '../src/index.js';
import type { Advisory, SbomComponent } from '../src/index.js';

const componentsMinimal: SbomComponent[] = [
  { name: 'lodash', version: '4.17.20', purl: 'pkg:npm/lodash@4.17.20', license: 'MIT' },
  { name: 'react', version: '18.3.1', purl: 'pkg:npm/react@18.3.1', license: 'MIT' },
];

describe('SBOM — CycloneDX', () => {
  it('T-SEC-SBOM-001 toCycloneDx wraps components into the CycloneDX shape', () => {
    const doc = toCycloneDx(componentsMinimal, '2026-07-07T00:00:00Z');
    expect(doc.format).toBe('cyclonedx');
    expect(doc.formatVersion).toBe('1.5');
    expect(doc.components).toHaveLength(2);
    expect(doc.generatedAtIso).toBe('2026-07-07T00:00:00Z');
  });

  it('T-SEC-SBOM-002 toCycloneDx defaults generatedAtIso to now', () => {
    const doc = toCycloneDx(componentsMinimal);
    expect(doc.generatedAtIso).not.toBe('');
  });
});

describe('SBOM — SPDX', () => {
  it('T-SEC-SBOM-003 toSpdx wraps components into the SPDX shape', () => {
    const doc = toSpdx(componentsMinimal, '2026-07-07T00:00:00Z');
    expect(doc.format).toBe('spdx');
    expect(doc.formatVersion).toBe('2.3');
  });
});

describe('SBOM — validate', () => {
  it('T-SEC-SBOM-004 flags missing name', () => {
    const doc = toCycloneDx([{ name: '', version: '1', purl: 'pkg:npm/x@1' }]);
    const r = validateSbom(doc);
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toContain('name');
  });

  it('T-SEC-SBOM-005 flags missing version', () => {
    const doc = toCycloneDx([{ name: 'x', version: '', purl: 'pkg:npm/x' }]);
    const r = validateSbom(doc);
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toContain('version');
  });

  it('T-SEC-SBOM-006 flags invalid purl', () => {
    const doc = toCycloneDx([{ name: 'x', version: '1', purl: 'npm/x@1' }]);
    const r = validateSbom(doc);
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toContain('purl');
  });

  it('T-SEC-SBOM-007 passes a valid document', () => {
    const doc = toCycloneDx(componentsMinimal);
    expect(validateSbom(doc).ok).toBe(true);
  });
});

describe('SBOM — versionInRange', () => {
  it('T-SEC-SBOM-008 matches an exact clause', () => {
    expect(versionInRange('1.2.3', '= 1.2.3')).toBe(true);
    expect(versionInRange('1.2.3', '1.2.3')).toBe(true);
  });

  it('T-SEC-SBOM-009 matches >= clauses', () => {
    expect(versionInRange('1.2.3', '>= 1.0.0')).toBe(true);
    expect(versionInRange('0.9.9', '>= 1.0.0')).toBe(false);
  });

  it('T-SEC-SBOM-010 matches < clauses', () => {
    expect(versionInRange('1.2.3', '< 2.0.0')).toBe(true);
    expect(versionInRange('2.0.1', '< 2.0.0')).toBe(false);
  });

  it('T-SEC-SBOM-011 supports OR disjunction', () => {
    expect(versionInRange('1.2.3', '< 1.0.0 || >= 2.0.0')).toBe(false);
    expect(versionInRange('2.0.0', '< 1.0.0 || >= 2.0.0')).toBe(true);
  });
});

describe('SBOM — advisory lookup', () => {
  const advisories: Advisory[] = [
    {
      id: 'CVE-2024-0001',
      affects: [{ purl: 'pkg:npm/lodash', versionRange: '< 4.17.21' }],
      severity: 'high',
      summary: 'prototype pollution',
      source: 'osv',
    },
    {
      id: 'CVE-2024-0002',
      affects: [{ purl: 'pkg:npm/react', versionRange: '< 18.0.0' }],
      severity: 'medium',
      summary: 'xss',
      source: 'nvd',
    },
  ];

  it('T-SEC-SBOM-012 lookupAdvisories finds affected component', () => {
    const doc = toCycloneDx(componentsMinimal);
    const hits = lookupAdvisories(doc, { advisories });
    // lodash 4.17.20 < 4.17.21 → hit; react 18.3.1 >= 18.0.0 → miss.
    const lodashHit = hits.find((h) => h.component.name === 'lodash');
    expect(lodashHit?.advisories.some((a) => a.id === 'CVE-2024-0001')).toBe(true);
  });

  it('T-SEC-SBOM-013 lookupAdvisories skips unaffected version', () => {
    const doc = toCycloneDx(componentsMinimal);
    const hits = lookupAdvisories(doc, { advisories });
    const reactHit = hits.find((h) => h.component.name === 'react');
    expect(reactHit).toBeUndefined();
  });

  it('T-SEC-SBOM-014 lookupAdvisories returns empty for a clean SBOM', () => {
    const doc = toCycloneDx([{ name: 'zzz', version: '1', purl: 'pkg:npm/zzz@1' }]);
    const hits = lookupAdvisories(doc, { advisories });
    expect(hits).toEqual([]);
  });
});

describe('SBOM — license policy', () => {
  it('T-SEC-SBOM-015 allows MIT under the default policy', () => {
    expect(evaluateLicense('MIT')).toBe('allow');
  });

  it('T-SEC-SBOM-016 denies GPL-3.0 under the default policy', () => {
    expect(evaluateLicense('GPL-3.0')).toBe('deny');
  });

  it('T-SEC-SBOM-017 warns on missing license', () => {
    expect(evaluateLicense(undefined)).toBe('warn');
  });

  it('T-SEC-SBOM-018 warns on MPL-2.0 under the default policy', () => {
    expect(evaluateLicense('MPL-2.0')).toBe('warn');
  });

  it('T-SEC-SBOM-019 uses the most permissive verdict for an OR expression', () => {
    expect(evaluateLicense('MIT OR GPL-3.0')).toBe('allow');
  });

  it('T-SEC-SBOM-020 respects a custom policy', () => {
    expect(
      evaluateLicense('MIT', {
        allow: [],
        warn: [],
        deny: ['MIT'],
      }),
    ).toBe('deny');
  });

  it('T-SEC-SBOM-021 DEFAULT_LICENSE_POLICY has stable entries', () => {
    expect(DEFAULT_LICENSE_POLICY.allow).toContain('MIT');
    expect(DEFAULT_LICENSE_POLICY.deny).toContain('AGPL-3.0');
  });
});

describe('SBOM — toSbomEvent', () => {
  it('T-SEC-SBOM-022 emits a deny event for advisory hit', () => {
    const ev = toSbomEvent({
      provider: 'helmet',
      verdict: 'deny',
      reason: 'CVE match',
      payload: { component: 'lodash' },
      timestamp: 42,
    });
    expect(ev.axis).toBe('sbom');
    expect(ev.verdict).toBe('deny');
  });
});
